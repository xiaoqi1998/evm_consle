from flask import Blueprint, request, g
from datetime import datetime
from extensions import db
from models import User, CallHistory
from utils import create_response, login_required_or_token, convert_to_json_serializable

# 创建历史记录蓝图
history_bp = Blueprint('history', __name__)

# --- 历史记录路由 ---
@history_bp.route('/api/history', methods=['GET'])
@login_required_or_token
def get_history():
    """
    获取调用历史
    ---    
    tags:
      - 历史记录
    security:
      - api_key: []
    responses:
      200:
        description: 获取调用历史成功
        schema:
          type: object
          properties:
            history:
              type: array
              description: 调用历史列表
      401:
        description: 未授权
    """
    username = g.user_username if hasattr(g, 'user_username') else None
    if not username:
        return create_response(status_code=401, error="Unauthorized", details="Authentication required.")
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return create_response(status_code=404, error="NotFound", details="User not found.")
    
    history = CallHistory.query.filter_by(user_id=user.id).order_by(CallHistory.timestamp.desc()).all()
    serializable_history = []
    
    for entry in history:
        serializable_entry = {
            'id': entry.id,
            'call_id': entry.call_id,
            'timestamp': entry.timestamp.isoformat(),
            'type': entry.type,
            'contract': entry.contract,
            'method': entry.method,
            'args': entry.args,
            'result': entry.result,
            'error': entry.error,
            'chain_id': entry.chain_id,
            'abi_name': entry.abi_name
        }
        serializable_history.append(serializable_entry)
    
    return create_response(data={"history": serializable_history}), 200

@history_bp.route('/api/history/clear', methods=['POST'])
@login_required_or_token
def clear_history():
    """
    清除调用历史
    ---    
    tags:
      - 历史记录
    security:
      - api_key: []
    responses:
      200:
        description: 清除调用历史成功
      401:
        description: 未授权
    """
    username = g.user_username if hasattr(g, 'user_username') else None
    if not username:
        return create_response(status_code=401, error="Unauthorized", details="Authentication required.")
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return create_response(status_code=404, error="NotFound", details="User not found.")
    
    CallHistory.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    
    return create_response(message="History cleared successfully"), 200
