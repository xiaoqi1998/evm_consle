from flask import Blueprint, request, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import logout_user
from extensions import db
from models import User, Account, RpcConfig
from utils import create_response, login_required_or_token, validate_json_input, get_user_accounts, get_user_rpcs, retry_on_db_error
import config as global_config
import base64
import socket
import ipaddress
from urllib.parse import urlparse

# 鍒涘缓閰嶇疆绠＄悊钃濆浘
config_bp = Blueprint('config', __name__)

# --- 閰嶇疆绠＄悊璺敱 ---
@config_bp.route('/get_configs', methods=['GET'])
@login_required_or_token
@retry_on_db_error()
def get_configs():
    try:
        username = g.user_username
        user = User.query.filter_by(username=username).first()
        
        # 1. 鑾峰彇瀹屾暣鐨勮处鎴峰瓧鍏?{"alias": {"address":...}}
        full_accounts = get_user_accounts() 
        
        # 銆愭牳蹇冧慨澶嶃€戝墠绔?forEach 闇€瑕佺殑鏄埆鍚嶅垪琛?["my_acc"]
        account_aliases = list(full_accounts.keys())

        # 2. 鑾峰彇 RPC 鍒楄〃 (纭繚杩斿洖鐨勬槸鍒楄〃鏍煎紡)
        chains = []
        processed_ids = set()
        
        # 鍔犺浇鐢ㄦ埛绉佹湁 RPC
        if user:
            for rpc in user.rpcs:
                cid_str = str(rpc.chain_id)
                if cid_str in processed_ids:
                    chains = [c for c in chains if c['chain_id'] != cid_str]
                
                chains.append({
                    "chain_id": cid_str,
                    "alias": rpc.alias or cid_str,
                    "rpc_url": rpc.rpc_url
                })

        # 銆愬叧閿€戣繑鍥炵殑缁撴瀯蹇呴』涓ユ牸鍖归厤 index.js 鐨勮В鏋愰€昏緫
        return create_response(data={
            "accounts": account_aliases,          # 蹇呴』鏄垪琛?[str, str]
            "chains": chains                      # 蹇呴』鏄垪琛?[obj, obj]
        })
    except Exception as e:
        import traceback
        import logging
        logging.error(f"Error in get_configs: {traceback.format_exc()}")
        return create_response(error="Failed to get configs", status_code=500)

@config_bp.route('/api/accounts', methods=['GET'])
@login_required_or_token
def get_accounts_api():
    """
    鑾峰彇璐︽埛鍒楄〃
    ---    
    tags:
      - 璐︽埛绠＄悊
    security:
      - api_key: []
    responses:
      200:
        description: 鑾峰彇璐︽埛鍒楄〃鎴愬姛
        schema:
          type: object
          properties:
            accounts:
              type: object
              description: 璐︽埛鍒楄〃锛岄敭涓鸿处鎴峰埆鍚嶏紝鍊间负璐︽埛淇℃伅
      401:
        description: 鏈巿鏉?    """
    return create_response(data=get_user_accounts())

@config_bp.route('/api/accounts/<alias>', methods=['GET'])
@login_required_or_token
def get_account(alias):
    """
    鑾峰彇鎸囧畾鍒悕鐨勮处鎴蜂俊鎭?    ---    
    tags:
      - 璐︽埛绠＄悊
    security:
      - api_key: []
    parameters:
      - name: alias
        in: path
        required: true
        type: string
        description: 璐︽埛鍒悕
    responses:
      200:
        description: 鑾峰彇璐︽埛淇℃伅鎴愬姛
        schema:
          type: object
          properties:
            address:
              type: string
              description: 璐︽埛鍦板潃
            pk_slice_server:
              type: string
              description: 鏈嶅姟鍣ㄥ瓨鍌ㄧ殑绉侀挜鍒囩墖
      404:
        description: 璐︽埛鏈壘鍒?      401:
        description: 鏈巿鏉?    """
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        account = Account.query.filter_by(user_id=user.id, alias=alias).first()
        if account:
            account_data = {
                "address": account.address
            }
            if hasattr(account, 'pk_slice_server'):
                account_data["pk_slice_server"] = account.pk_slice_server
            return create_response(data=account_data)
    return create_response(error="AccountNotFound", details=f"Account alias '{alias}' not found.", status_code=404)

@config_bp.route('/add_account', methods=['POST'])
@login_required_or_token
def add_account():
    """
    娣诲姞璐︽埛
    ---    
    tags:
      - 璐︽埛绠＄悊
    security:
      - api_key: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - alias
            - address
            - pk_slice_server
          properties:
            alias:
              type: string
              description: 璐︽埛鍒悕
            address:
              type: string
              description: 璐︽埛鍦板潃
            pk_slice_server:
              type: string
              description: 鏈嶅姟鍣ㄥ瓨鍌ㄧ殑绉侀挜鍒囩墖
    responses:
      200:
        description: 娣诲姞璐︽埛鎴愬姛
      400:
        description: 鍙傛暟閿欒
      401:
        description: 鏈巿鏉?    """
    data = request.json
    alias = data.get('alias')
    address = data.get('address')
    pk_slice_server = data.get('pk_slice_server')
    
    # Validate required fields
    if not alias or not address:
        return create_response(error="Missing parameters", details="alias and address are required", status_code=400)
    
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        new_account = Account(
            user_id=user.id,
            alias=alias,
            address=address,
            pk_slice_server=pk_slice_server
        )
        db.session.add(new_account)
        db.session.commit()
        return create_response(message="Account saved")
    return create_response(message="User not found", status_code=404, error="NotFound")

@config_bp.route('/api/accounts', methods=['POST'])
@login_required_or_token
def save_account():
    """
    淇濆瓨璐︽埛
    ---    
    tags:
      - 璐︽埛绠＄悊
    security:
      - api_key: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - alias
            - address
            - pk_slice_server
          properties:
            alias:
              type: string
              description: 璐︽埛鍒悕
            address:
              type: string
              description: 璐︽埛鍦板潃
            pk_slice_server:
              type: string
              description: 鏈嶅姟鍣ㄥ瓨鍌ㄧ殑绉侀挜鍒囩墖
    responses:
      200:
        description: 淇濆瓨璐︽埛鎴愬姛
      400:
        description: 鍙傛暟閿欒
      401:
        description: 鏈巿鏉?    """
    data = request.json
    alias = data.get('alias')
    address = data.get('address')
    pk_slice_server = data.get('pk_slice_server')
    
    if not alias or not address:
        return create_response(error="Missing parameters", status_code=400)
    
    username = g.user_username
    user = User.query.filter_by(username=username).first()
    
    if user:
        acc = Account.query.filter_by(user_id=user.id, alias=alias).first()
        if not acc:
            acc = Account(user_id=user.id, alias=alias)
            db.session.add(acc)
        
        acc.address = address
        acc.pk_slice_server = pk_slice_server
        db.session.commit()
        return create_response(message="Account slice saved to server")
    return create_response(message="User not found", status_code=404)

@config_bp.route('/api/accounts/<alias>', methods=['DELETE'])
@login_required_or_token
def delete_account_api(alias):
    """
    鍒犻櫎璐︽埛
    ---    
    tags:
      - 璐︽埛绠＄悊
    security:
      - api_key: []
    parameters:
      - name: alias
        in: path
        required: true
        type: string
        description: 璐︽埛鍒悕
    responses:
      200:
        description: 鍒犻櫎璐︽埛鎴愬姛
      403:
        description: 绯荤粺璐︽埛绂佹鍒犻櫎
      404:
        description: 璐︽埛鏈壘鍒?      401:
        description: 鏈巿鏉?    """
    # 绂佹鍒犻櫎绯荤粺棰勮璐︽埛锛堝凡绉婚櫎榛樿璐︽埛锛屾墍鏈夎处鎴峰潎鍙垹闄わ級
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        account = Account.query.filter_by(user_id=user.id, alias=alias).first()
        if account:
            db.session.delete(account)
            db.session.commit()
            return create_response(message="Account deleted")
    return create_response(message="Account not found", status_code=404, error="NotFound")

@config_bp.route('/api/rpcs', methods=['GET'])
@login_required_or_token
def get_rpcs_api():
    """
    鑾峰彇RPC鍒楄〃
    ---    
    tags:
      - RPC绠＄悊
    security:
      - api_key: []
    responses:
      200:
        description: 鑾峰彇RPC鍒楄〃鎴愬姛
        schema:
          type: object
          properties:
            rpcs:
              type: object
              description: RPC鍒楄〃锛岄敭涓洪摼ID锛屽€间负RPC URL
      401:
        description: 鏈巿鏉?    """
    username = g.user_username if hasattr(g, 'user_username') else None
    # 鍔犺浇鐢ㄦ埛鑷畾涔?RPC
    result = []
    processed_ids = set()
    
    if username:
        user = User.query.filter_by(username=username).first()
        if user:
            for rpc in user.rpcs:
                cid_str = rpc.chain_id
                user_rpc = {
                    "chain_id": cid_str,
                    "alias": rpc.alias or cid_str,
                    "rpc_url": rpc.rpc_url
                }
                result.append(user_rpc) 
                processed_ids.add(cid_str)
                
    return create_response(data=result)

@config_bp.route('/api/rpcs', methods=['POST'])
@login_required_or_token
def add_rpc_api():
    """
    娣诲姞RPC
    ---    
    tags:
      - RPC绠＄悊
    security:
      - api_key: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - chain_id
            - rpc_url
          properties:
            chain_id:
              type: string
              description: 閾綢D
            rpc_url:
              type: string
              description: RPC URL
            alias:
              type: string
              description: 閾惧埆鍚?    responses:
      200:
        description: 娣诲姞RPC鎴愬姛
      400:
        description: 鍙傛暟閿欒
      401:
        description: 鏈巿鏉?    """
    data = request.json
    chain_id = str(data.get('chain_id'))
    rpc_url = data.get('rpc_url')
    alias = data.get('alias') or chain_id
    
    # 楠岃瘉鍒悕闀垮害
    if len(alias) > 7:
        return create_response(message="Alias length must be <= 7", status_code=400, error="InvalidAliasLength")
    # SSRF protection: reject localhost/private/link-local/metadata RPC URLs
    try:
        parsed = urlparse(rpc_url)
        hostname = parsed.hostname.lower() if parsed.hostname else None
        if parsed.scheme not in ("http", "https") or not hostname:
            return create_response(message="RPC URL 非法", status_code=400, error="InvalidRpcUrl")

        if hostname in ("localhost", "metadata.google.internal"):
            return create_response(message="禁止使用本地或内网 RPC", status_code=400, error="InvalidRpcUrl")

        def _blocked_ip(ip_obj):
            return (
                ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or
                ip_obj.is_multicast or ip_obj.is_reserved or ip_obj.is_unspecified or
                str(ip_obj) == "169.254.169.254"
            )

        try:
            ip_obj = ipaddress.ip_address(hostname)
            if _blocked_ip(ip_obj):
                return create_response(message="禁止使用本地或内网 RPC", status_code=400, error="InvalidRpcUrl")
        except ValueError:
            resolved = socket.getaddrinfo(hostname, None)
            for entry in resolved:
                ip_obj = ipaddress.ip_address(entry[4][0])
                if _blocked_ip(ip_obj):
                    return create_response(message="禁止使用本地或内网 RPC", status_code=400, error="InvalidRpcUrl")
    except Exception:
        return create_response(message="RPC URL 校验失败", status_code=400, error="InvalidRpcUrl")
    
    
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        # 妫€鏌ユ槸鍚﹀凡瀛樺湪鍚屽悕RPC
        existing_rpc = RpcConfig.query.filter_by(user_id=user.id, chain_id=chain_id).first()
        if existing_rpc:
            existing_rpc.rpc_url = rpc_url
            existing_rpc.alias = alias
        else:
            new_rpc = RpcConfig(
                user_id=user.id,
                chain_id=chain_id,
                rpc_url=rpc_url,
                alias=alias
            )
            db.session.add(new_rpc)
        
        db.session.commit()
        return create_response(message="RPC saved")
    return create_response(message="User not found", status_code=404, error="NotFound")

@config_bp.route('/api/rpcs/<chain_id>', methods=['DELETE'])
@login_required_or_token
def delete_rpc_api(chain_id):
    """
    鍒犻櫎RPC
    ---    
    tags:
      - RPC绠＄悊
    security:
      - api_key: []
    parameters:
      - name: chain_id
        in: path
        required: true
        type: string
        description: 閾綢D
    responses:
      200:
        description: 鍒犻櫎RPC鎴愬姛
      403:
        description: 绯荤粺RPC绂佹鍒犻櫎
      404:
        description: RPC鏈壘鍒?      401:
        description: 鏈巿鏉?    """
    chain_id_str = str(chain_id)
    
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        # 鐩存帴鍒犻櫎鐢ㄦ埛鑷畾涔塕PC
        rpc = RpcConfig.query.filter_by(user_id=user.id, chain_id=chain_id_str).first()
        if rpc:
            db.session.delete(rpc)
            db.session.commit()
            return create_response(message="RPC deleted")
    return create_response(message="RPC not found", status_code=404, error="NotFound")

@config_bp.route('/api/public_key', methods=['GET'])
def get_public_key():
    """
    鑾峰彇RSA鍏挜
    ---    
    tags:
      - 鍏紑API
    responses:
      200:
        description: 鑾峰彇鍏挜鎴愬姛
        schema:
          type: object
          properties:
            public_key:
              type: string
              description: Base64缂栫爜鐨凴SA鍏挜
    """
    # 鐢熸垚RSA瀵嗛挜瀵癸紙杩欓噷浣跨敤棰勫畾涔夌殑鍏挜锛屽疄闄呯敓浜х幆澧冨簲浠庨厤缃姞杞斤級
    public_key = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8kGa1pSjbSYZVebtTRBLxBz5H\n4i2p/llLCrEeQhta5kaQu/RnvuER4W8oDH3+3iuIYW4VQAzyqFpwuzjkDI+17t5t\n0tyazyZ8JXw+KgXTxldMPEL95+qVhgXvwtihXC1c5oGbRlEDvDF6Sa53rcFVsYJ4\nehde/zUxo6UvS7UrBQIDAQAB\n-----END PUBLIC KEY-----"
    return create_response(data={"public_key": public_key})
