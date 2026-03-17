from flask import Blueprint, request, g
from datetime import datetime
from extensions import db
from models import User, CallHistory
from utils import create_response, login_required_or_token, convert_to_json_serializable

# 创建历史记录蓝图
history_bp = Blueprint('history', __name__)

# --- 历史记录路由 ---
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
