import json
import secrets
from datetime import datetime
from flask import Blueprint, request, g
from web3 import Web3
from web3.exceptions import BadFunctionCallOutput
from werkzeug.utils import secure_filename
import os
import config as global_config
from extensions import db
from models import User, Abi, CallHistory
from utils import create_response, convert_to_json_serializable, cast_args_by_abi, cast_value_by_abi_type, login_required_or_token, validate_json_input, get_web3_instance, load_abi, save_call_history, get_user_rpcs
from flask import Blueprint, request, g, current_app # 加上 current_app
from utils import (
    create_response, 
    convert_to_json_serializable, 
    cast_args_by_abi, 
    get_web3_instance, 
    load_abi, 
    save_call_history, 
    login_required_or_token,
    get_current_username,
    get_user_accounts  # <--- 必须加上这一行！
)

# 创建合约交互蓝图
contract_bp = Blueprint('contract', __name__)



# --- 合约交互路由 ---
@contract_bp.route('/upload_abi', methods=['POST'])
@login_required_or_token
def upload_abi():
    """
    上传ABI
    ---    
    tags:
      - ABI管理
    security:
      - api_key: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - abi_name
            - abi_content
          properties:
            abi_name:
              type: string
              description: ABI名称
            abi_content:
              type: object
              description: ABI内容
    responses:
      200:
        description: 上传ABI成功
      400:
        description: 参数错误
      401:
        description: 未授权
    """
    data = request.get_json()
    abi_name = data.get('abi_name')
    abi_content = data.get('abi_content')
    
    safe_name = secure_filename(abi_name)
    if not safe_name:
        return create_response(error="Invalid ABI name", details="The provided ABI name is invalid.", status_code=400)
    
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        # 检查是否已存在同名ABI
        existing_abi = Abi.query.filter_by(user_id=user.id, name=safe_name).first()
        if existing_abi:
            existing_abi.content = abi_content
        else:
            new_abi = Abi(
                user_id=user.id,
                name=safe_name,
                content=abi_content
            )
            db.session.add(new_abi)
        db.session.commit()
        return create_response(message=f"ABI '{abi_name}' uploaded successfully"), 200
    return create_response(message="用户未找到", status_code=404, error="NotFound")

@contract_bp.route('/delete_abi', methods=['DELETE'])
@login_required_or_token
def delete_abi():
    """
    删除ABI
    ---    
    tags:
      - ABI管理
    security:
      - api_key: []
    parameters:
      - name: abi_name
        in: query
        required: true
        type: string
        description: ABI名称
    responses:
      200:
        description: 删除ABI成功
      400:
        description: 参数错误
      404:
        description: ABI未找到
      401:
        description: 未授权
    """
    abi_name = request.args.get('abi_name')
    if not abi_name:
        return create_response(error="Missing parameter", details="Required parameter 'abi_name' is missing", status_code=400)
    
    safe_name = secure_filename(abi_name)
    username = g.user_username if hasattr(g, 'user_username') else None
    user = User.query.filter_by(username=username).first() if username else None
    
    if user:
        abi = Abi.query.filter_by(user_id=user.id, name=safe_name).first()
        if abi:
            db.session.delete(abi)
            db.session.commit()
            return create_response(message=f"ABI '{abi_name}' deleted successfully"), 200
    
    return create_response(error="ABI not found", details=f"ABI file '{abi_name}' does not exist.", status_code=404)

@contract_bp.route('/list_abis', methods=['GET'])
@login_required_or_token
def list_abis():
    """
    获取ABI列表
    ---    
    tags:
      - ABI管理
    security:
      - api_key: []
    responses:
      200:
        description: 获取ABI列表成功
        schema:
          type: object
          properties:
            abis:
              type: array
              items:
                type: string
              description: ABI名称列表
      500:
        description: 服务器错误
      401:
        description: 未授权
    """
    try:
        username = g.user_username if hasattr(g, 'user_username') else None
        user = User.query.filter_by(username=username).first() if username else None
        user_abis = []
        if user:
            user_abis = [abi.name for abi in user.abis]
        
        return create_response(data={"abis": user_abis}), 200
    except Exception as e:
        return create_response(error="Failed to list ABIs", details=str(e)), 500

@contract_bp.route('/read_contract', methods=['POST'])
@login_required_or_token
def read_contract():
    """
    调用合约的只读方法（View/Pure）
    ---    
    tags:
      - 合约操作
    security:
      - api_key: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - contract_address
            - abi_name
            - method_name
            - args
          properties:
            contract_address:
              type: string
              description: 合约地址
            abi_name:
              type: string
              description: 使用的 ABI 文件名
            method_name:
              type: string
              description: 方法名称
            args:
              type: array
              description: 调用参数列表
            chain_id:
              type: integer
              description: 链 ID
            chain_alias:
              type: string
              description: 链别名
            rpc_url:
              type: string
              description: RPC URL
    responses:
      200:
        description: 读取合约成功
        schema:
          type: object
          properties:
            result:
              description: 方法执行的结果
      400:
        description: 参数错误
      401:
        description: 未授权
      500:
        description: 服务器错误
    """
    data = request.get_json()
    
    w3, rpc_url, error_res = get_web3_instance(data)
    if error_res:
        return error_res
    
    contract_address = data.get('contract_address')
    abi_name = data.get('abi_name')
    method_name = data.get('method_name')
    args = data.get('args', [])
    
    if not w3.is_address(contract_address):
        return create_response(error="Invalid contract_address format", details=f"Provided contract_address '{contract_address}' is not a valid Ethereum address."), 400

    try:
        abi = load_abi(abi_name)
        
        # 查找当前方法的 ABI 定义
        method_abi = next((item for item in abi if item.get('name') == method_name and item.get('type') == 'function'), None)
        if method_abi:
            # 自动转换参数类型
            args = cast_args_by_abi(method_abi.get('inputs', []), args)

        contract_address_checksum = w3.to_checksum_address(contract_address)
        contract = w3.eth.contract(address=contract_address_checksum, abi=abi)
        
        # 动态获取方法对象并调用
        contract_method = getattr(contract.functions, method_name)
        result = contract_method(*args).call()
        
        # 转换 Web3 特有类型为 JSON 可序列化类型
        serializable_result = convert_to_json_serializable(result)
        
        # 保存历史记录
        username = g.user_username if hasattr(g, 'user_username') else None
        if username:
            save_call_history(username, 'read', contract_address, method_name, args, result=serializable_result, chain_id=data.get('chain_id'), abi_name=abi_name)
            
        return create_response(data={"result": serializable_result}), 200
    except FileNotFoundError as e:
        return create_response(error="ABI file not found", details=str(e)), 404
    except Exception as e:
        # 保存错误历史
        username = g.user_username if hasattr(g, 'user_username') else None
        if username:
            save_call_history(username, 'read', contract_address, method_name, args, error=str(e), chain_id=data.get('chain_id'), abi_name=abi_name)
        return create_response(error="Failed to read contract", details=str(e)), 500

@contract_bp.route('/get_events', methods=['POST'])
@login_required_or_token
def get_events():
    """
    获取合约事件
    ---    
    tags:
      - 合约操作
    security:
      - api_key: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - contract_address
            - abi_name
            - event_name
          properties:
            contract_address:
              type: string
              description: 合约地址
            abi_name:
              type: string
              description: ABI文件名称
            event_name:
              type: string
              description: 事件名称
            from_block:
              type: string
              description: 起始区块（数字、'earliest'等）
            to_block:
              type: string
              description: 结束区块（数字、'latest'等）
            argument_filters:
              type: object
              description: 事件参数过滤字典
            chain_id:
              type: integer
              description: 链ID
            chain_alias:
              type: string
              description: 链别名
            rpc_url:
              type: string
              description: RPC URL
    responses:
      200:
        description: 获取事件成功
        schema:
          type: object
          properties:
            events:
              type: array
              description: 事件列表
      400:
        description: 参数错误
      401:
        description: 未授权
      500:
        description: 服务器错误
    """
    data = request.get_json()
    
    contract_address = data.get('contract_address')
    abi_name = data.get('abi_name')
    event_name = data.get('event_name')
    from_block = data.get('from_block', 0)
    to_block = data.get('to_block', 'latest')
    argument_filters = data.get('argument_filters', {})

    # 1. 确定 Web3 实例和 RPC
    w3, rpc_url, error_res = get_web3_instance(data)
    if error_res:
        return error_res

    if not w3.is_address(contract_address):
        return create_response(error="Invalid contract_address format", details=f"Provided contract_address '{contract_address}' is not a valid Ethereum address."), 400

    try:
        abi = load_abi(abi_name)
        
        # 查找当前事件的 ABI 定义
        event_abi = next((item for item in abi if item.get('name') == event_name and item.get('type') == 'event'), None)
        if event_abi and argument_filters:
            # 自动转换事件过滤参数
            for key, val in argument_filters.items():
                input_def = next((inp for inp in event_abi.get('inputs', []) if inp.get('name') == key), None)
                if input_def:
                    argument_filters[key] = cast_value_by_abi_type(val, input_def['type'], input_def.get('components'))

        contract_address_checksum = w3.to_checksum_address(contract_address)
        contract = w3.eth.contract(address=contract_address_checksum, abi=abi)

        # 检查事件是否存在于 ABI 中
        if not hasattr(contract.events, event_name):
            return create_response(error="Event not found", details=f"The event '{event_name}' was not found in this contract's abi."), 400

        # 获取事件日志
        # 注意：对于大范围区块，直接 get_logs 可能会因为 RPC 限制而失败
        logs = contract.events[event_name].get_logs(
            from_block=from_block,
            to_block=to_block,
            argument_filters=argument_filters
        )

        event_logs = []
        for log in logs:
            # 转换 Log 对象为可序列化字典
            event_logs.append(convert_to_json_serializable(dict(log)))

        return create_response(data={"event_logs": event_logs}), 200
    except FileNotFoundError as e:
        return create_response(error="ABI file not found", details=str(e)), 404
    except Exception as e:
        return create_response(error="Failed to get event logs", details=str(e)), 500

# contract_bp.py 文件末尾补上
from utils import login_required_or_token

# 历史记录查询
@contract_bp.route('/api/history', methods=['GET'])
@login_required_or_token
def get_history():
    username = g.user_username
    user = User.query.filter_by(username=username).first()
    if user:
        history = CallHistory.query.filter_by(user_id=user.id).order_by(CallHistory.timestamp.desc()).limit(100).all()
        history_list = []
        for entry in history:
            history_list.append({
                "timestamp": entry.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "type": entry.type,
                "contract": entry.contract,
                "method": entry.method,
                "args": entry.args,
                "result": entry.result,
                "error": entry.error,
                "abi_name": entry.abi_name
            })
        return create_response(data=history_list)
    return create_response(data=[])

# 清空历史
@contract_bp.route('/api/history/clear', methods=['POST'])
@login_required_or_token
def clear_history():
    username = g.user_username
    user = User.query.filter_by(username=username).first()
    if user:
        CallHistory.query.filter_by(user_id=user.id).delete()
        db.session.commit()
    return create_response(message="History cleared")

# ！！！重要：你可能还漏掉了最重要的 write_contract ！！！
@contract_bp.route('/write_contract', methods=['POST'])
@login_required_or_token
def write_contract():
    data = request.get_json()
    current_app.logger.info(f"收到写入合约请求: {data}")
    
    # 提前获取参数，用于无论成功失败都保存历史
    raw_transaction = data.get('raw_transaction')
    username = get_current_username()

    # 1. 确定 Web3 实例
    w3, rpc_url, error_res = get_web3_instance(data)
    if error_res: return error_res

    try:
        # 验证原始交易参数
        if not raw_transaction:
            raise ValueError("raw_transaction parameter is required")
            
        # 确保 raw_transaction 是 bytes 类型
        if isinstance(raw_transaction, str):
            # 移除 0x 前缀如果存在
            if raw_transaction.startswith('0x'):
                raw_transaction = raw_transaction[2:]
            # 转换为 bytes
            raw_transaction = bytes.fromhex(raw_transaction)
        elif not isinstance(raw_transaction, bytes):
            raise TypeError(f"raw_transaction must be str or bytes, got {type(raw_transaction)}")
            
        # 发送已签名的原始交易
        tx_hash = w3.eth.send_raw_transaction(raw_transaction)
        
        # --- 成功记录历史 ---
        if username:
            save_call_history(username, 'write', None, None, None, 
                              result={"transaction_hash": tx_hash.hex()})
            
        return create_response(data={"transaction_hash": tx_hash.hex()}), 200

    except Exception as e:
        current_app.logger.error(f"写入合约出错: {str(e)}", exc_info=True)
        # --- 失败也要记录历史 (重点修正) ---
        if username:
            save_call_history(username, 'write', None, None, None, 
                              error=str(e))
        return create_response(error="Failed to write contract", details=str(e)), 500


@contract_bp.route('/get_abi_details', methods=['GET'])
@login_required_or_token
def get_abi_details():
    """
    获取 ABI 的详细信息，包括函数、事件、错误等分类。
    """
    abi_name = request.args.get('abi_name')

    if not abi_name:
        return create_response(error="Missing parameter", details="Required parameter 'abi_name' is missing", status_code=400)

    try:
        # load_abi 会从数据库或本地目录读取 ABI
        abi = load_abi(abi_name)
        
        # 初始化分类容器
        categorized_abi = {
            "functions": [],
            "events": [],
            "errors": [],
            "constructor": None,
            "fallback": None,
            "receive": None,
            "other": []
        }

        for item in abi:
            item_type = item.get('type')
            if item_type == 'function':
                categorized_abi["functions"].append(item)
            elif item_type == 'event':
                categorized_abi["events"].append(item)
            elif item_type == 'error':
                categorized_abi["errors"].append(item)
            elif item_type == 'constructor':
                categorized_abi["constructor"] = item
            elif item_type == 'fallback':
                categorized_abi["fallback"] = item
            elif item_type == 'receive':
                categorized_abi["receive"] = item
            else:
                categorized_abi["other"].append(item)
        
        # 返回分类后的结果和完整的 ABI 供前端使用
        return create_response(data={"details": categorized_abi, "full_abi": abi}), 200

    except FileNotFoundError as e:
        return create_response(error="ABI file not found", details=str(e), status_code=404)
    except Exception as e:
        return create_response(error="Failed to get ABI details", details=str(e), status_code=500)
