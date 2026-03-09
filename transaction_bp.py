import json
import secrets
from datetime import datetime
from flask import Blueprint, request, g
from web3 import Web3
from web3.exceptions import BadFunctionCallOutput
from hexbytes import HexBytes
from werkzeug.utils import secure_filename
import os
import config as global_config
from extensions import db
from models import User
from utils import create_response, convert_to_json_serializable, cast_args_by_abi, cast_value_by_abi_type, login_required_or_token, validate_json_input, get_web3_instance, load_abi, save_call_history, get_user_rpcs, get_user_accounts

# 创建交易蓝图
transaction_bp = Blueprint('transaction', __name__)

# --- 交易相关路由 ---
@transaction_bp.route('/write_contract', methods=['POST'])
@login_required_or_token
@validate_json_input(schema={
    'raw_transaction': str,
    'contract_address': str, 
    'abi_name': str, 
    'method_name': str, 
    'args': list,
    'chain_id': (int, type(None)),
    'chain_alias': (str, type(None)),
    'rpc_url': (str, type(None))
})
def write_contract():
    """
    调用合约的写入方法（非 View/Pure）
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
            - raw_transaction
            - contract_address
            - abi_name
            - method_name
            - args
          properties:
            raw_transaction:
              type: string
              description: 前端已签名的原始交易（十六进制字符串）
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
        description: 交易已发送
        schema:
          type: object
          properties:
            transaction_hash:
              type: string
              description: 交易哈希
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
    
    raw_transaction = data.get('raw_transaction')
    contract_address = data.get('contract_address')
    abi_name = data.get('abi_name')
    method_name = data.get('method_name')
    args = data.get('args', [])
    
    if not w3.is_address(contract_address):
        return create_response(error="Invalid contract_address format", details=f"Provided contract_address '{contract_address}' is not a valid Ethereum address."), 400

    try:
        # 发送已签名的原始交易
        tx_hash = w3.eth.send_raw_transaction(raw_transaction)
        
        # 转换为十六进制字符串
        tx_hash_hex = tx_hash.hex()
        
        # 保存历史记录
        username = g.user_username if hasattr(g, 'user_username') else None
        if username:
            save_call_history(username, 'write', contract_address, method_name, args, result=tx_hash_hex, chain_id=data.get('chain_id'), abi_name=abi_name)
            
        return create_response(data={"transaction_hash": tx_hash_hex}), 200
    except FileNotFoundError as e:
        return create_response(error="ABI file not found", details=str(e)), 404
    except Exception as e:
        # 保存错误历史
        username = g.user_username if hasattr(g, 'user_username') else None
        if username:
            save_call_history(username, 'write', contract_address, method_name, args, error=str(e), chain_id=data.get('chain_id'), abi_name=abi_name)
        return create_response(error="Failed to write contract", details=str(e)), 500

@transaction_bp.route('/get_transaction_receipt', methods=['POST'])
@login_required_or_token
@validate_json_input(schema={
    'transaction_hash': str,
    'chain_id': (int, type(None)),
    'chain_alias': (str, type(None)),
    'rpc_url': (str, type(None))
})
def get_transaction_receipt():
    """
    获取交易回执
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
            - transaction_hash
          properties:
            transaction_hash:
              type: string
              description: 交易哈希
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
        description: 获取交易回执成功
        schema:
          type: object
          properties:
            receipt:
              description: 交易回执
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
    
    transaction_hash = data.get('transaction_hash')
    
    try:
        receipt = w3.eth.get_transaction_receipt(transaction_hash)
        serializable_receipt = convert_to_json_serializable(receipt)
        return create_response(data={"receipt": serializable_receipt}), 200
    except Exception as e:
        return create_response(error="Failed to get transaction receipt", details=str(e)), 500

@transaction_bp.route('/decode_transaction', methods=['POST'])
@login_required_or_token
@validate_json_input(schema={
    'transaction_hash': str,
    'abi_name': str,
    'chain_id': (int, type(None)),
    'chain_alias': (str, type(None)),
    'rpc_url': (str, type(None))
})
def decode_transaction():
    """
    解码交易
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
            - transaction_hash
            - abi_name
          properties:
            transaction_hash:
              type: string
              description: 交易哈希
            abi_name:
              type: string
              description: ABI 文件名
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
        description: 解码交易成功
        schema:
          type: object
          properties:
            decoded:
              description: 解码结果
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
    
    transaction_hash = data.get('transaction_hash')
    abi_name = data.get('abi_name')
    
    try:
        abi = load_abi(abi_name)
        transaction = w3.eth.get_transaction(transaction_hash)
        
        # 解码输入数据
        contract = w3.eth.contract(abi=abi)
        decoded_input = contract.decode_function_input(transaction['input'])
        
        serializable_result = convert_to_json_serializable(decoded_input)
        return create_response(data={"decoded": serializable_result}), 200
    except FileNotFoundError as e:
        return create_response(error="ABI file not found", details=str(e)), 404
    except Exception as e:
        return create_response(error="Failed to decode transaction", details=str(e)), 500
