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

# 创建配置管理蓝图
config_bp = Blueprint('config', __name__)

# --- 配置管理路由 ---
@config_bp.route('/get_configs', methods=['GET'])
@login_required_or_token
@retry_on_db_error()
def get_configs():
    try:
        username = g.user_username
        user = User.query.filter_by(username=username).first()
        
        # 1. 获取完整的账户字典{"alias": {"address":...}}
        full_accounts = get_user_accounts() 
        
        # 【核心备份】前端forEach 需要的是别名列表["my_acc"]
        account_aliases = list(full_accounts.keys())

        # 2. 获取 RPC 列表 (确保返回的是列表格式)
        chains = []
        processed_ids = set()
        
        # 加载默认 RPC
        for conf in global_config.GLOBAL_DEFAULT_RPCS:
            cid_str = str(conf["chain_id"])
            if cid_str in processed_ids:
                chains = [c for c in chains if c['chain_id'] != cid_str]
            
            chains.append({
                "chain_id": cid_str,
                "alias": conf.get("alias", cid_str),
                "rpc_url": conf["rpc_url"]
            })
            processed_ids.add(cid_str)
        
        # 加载用户自有 RPC（覆盖默认 RPC）
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

        # 【关键】返回的结构必须严格匹配 index.js 的解析逻辑
        return create_response(data={
            "accounts": account_aliases,          # 必须是列表[str, str]
            "chains": chains                      # 必须是列表[obj, obj]
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
    获取账户列表
    ---    
    tags:
      - 账户管理
    security:
      - api_key: []
    responses:
      200:
        description: 获取账户列表成功
        schema:
          type: object
          properties:
            accounts:
              type: object
              description: 账户列表，键为账户别名，值为账户信息
      401:
        description: 未授权
    """
    return create_response(data=get_user_accounts())

@config_bp.route('/api/accounts/<alias>', methods=['GET'])
@login_required_or_token
def get_account(alias):
    """
    获取指定别名的账户信息
    ---    
    tags:
      - 账户管理
    security:
      - api_key: []
    parameters:
      - name: alias
        in: path
        required: true
        type: string
        description: 账户别名
    responses:
      200:
        description: 获取账户信息成功
        schema:
          type: object
          properties:
            address:
              type: string
              description: 账户地址
            pk_slice_server:
              type: string
              description: 服务器存储的私钥分片
      404:
        description: 账户未找到
      401:
        description: 未授权
    """
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
    添加账户
    ---    
    tags:
      - 账户管理
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
              description: 账户别名
            address:
              type: string
              description: 账户地址
            pk_slice_server:
              type: string
              description: 服务器存储的私钥分片
    responses:
      200:
        description: 添加账户成功
      400:
        description: 参数错误
      401:
        description: 未授权
    """
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
    保存账户
    ---    
    tags:
      - 账户管理
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
              description: 账户别名
            address:
              type: string
              description: 账户地址
            pk_slice_server:
              type: string
              description: 服务器存储的私钥分片
    responses:
      200:
        description: 保存账户成功
      400:
        description: 参数错误
      401:
        description: 未授权
    """
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
    删除账户
    ---    
    tags:
      - 账户管理
    security:
      - api_key: []
    parameters:
      - name: alias
        in: path
        required: true
        type: string
        description: 账户别名
    responses:
      200:
        description: 删除账户成功
      403:
        description: 系统账户禁止删除
      404:
        description: 账户未找到
      401:
        description: 未授权
    """
    # 禁止删除系统预设账户（已移除默认账户）所有账户均可删除
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
    获取RPC列表
    ---    
    tags:
      - RPC管理
    security:
      - api_key: []
    responses:
      200:
        description: 获取RPC列表成功
        schema:
          type: object
          properties:
            rpcs:
              type: object
              description: RPC列表，键为链ID，值为RPC URL
      401:
        description: 未授权
    """
    username = g.user_username if hasattr(g, 'user_username') else None
    # 加载默认 RPC
    result = []
    processed_ids = set()
    
    for conf in global_config.GLOBAL_DEFAULT_RPCS:
        chain_id = str(conf["chain_id"])
        if chain_id in processed_ids:
            result = [r for r in result if r['chain_id'] != chain_id]
        
        result.append({
            "chain_id": chain_id,
            "alias": conf.get("alias", chain_id),
            "rpc_url": conf["rpc_url"]
        })
        processed_ids.add(chain_id)
    
    # 加载用户自定义 RPC（覆盖默认 RPC）
    if username:
        user = User.query.filter_by(username=username).first()
        if user:
            for rpc in user.rpcs:
                cid_str = str(rpc.chain_id)
                if cid_str in processed_ids:
                    result = [r for r in result if r['chain_id'] != cid_str]
                
                result.append({
                    "chain_id": cid_str,
                    "alias": rpc.alias or cid_str,
                    "rpc_url": rpc.rpc_url
                })
                processed_ids.add(cid_str)
                
    return create_response(data=result)

@config_bp.route('/api/rpcs', methods=['POST'])
@login_required_or_token
def add_rpc_api():
    """
    添加RPC
    ---    
    tags:
      - RPC管理
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
              description: 链ID
            rpc_url:
              type: string
              description: RPC URL
            alias:
              type: string
              description: 链别名
    responses:
      200:
        description: 添加RPC成功
      400:
        description: 参数错误
      401:
        description: 鏈巿鏉?    """
    tips={
  "status": "error",
  "message": "暂时不支持添加RPC",
  "error": "NotSupported"
}
    return tips, 400
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
    删除RPC
    ---    
    tags:
      - RPC管理
    security:
      - api_key: []
    parameters:
      - name: chain_id
        in: path
        required: true
        type: string
        description: 链ID
    responses:
      200:
        description: 删除RPC成功
      403:
        description: 系统RPC禁止删除
      404:
        description: RPC未找到
      401:
        description: 未授权
    """
    chain_id_str = str(chain_id)
    
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        # 直接删除用户自定义 RPC
        rpc = RpcConfig.query.filter_by(user_id=user.id, chain_id=chain_id_str).first()
        if rpc:
            db.session.delete(rpc)
            db.session.commit()
            return create_response(message="RPC deleted")
    return create_response(message="RPC not found", status_code=404, error="NotFound")

@config_bp.route('/api/public_key', methods=['GET'])
def get_public_key():
    """
    获取RSA公钥
    ---    
    tags:
      - 公开API
    responses:
      200:
        description: 获取公钥成功
        schema:
          type: object
          properties:
            public_key:
              type: string
              description: Base64编码的RSA公钥
    """
    # 生成RSA密钥对（这里使用预定义的公钥，实际环境应从配置加载）
    public_key = "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8kGa1pSjbSYZVebtTRBLxBz5H\n4i2p/llLCrEeQhta5kaQu/RnvuER4W8oDH3+3iuIYW4VQAzyqFpwuzjkDI+17t5t\n0tyazyZ8JXw+KgXTxldMPEL95+qVhgXvwtihXC1c5oGbRlEDvDF6Sa53rcFVsYJ4\nehde/zUxo6UvS7UrBQIDAQAB\n-----END PUBLIC KEY-----"
    return create_response(data={"public_key": public_key})
