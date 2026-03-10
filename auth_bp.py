from flask import Blueprint, request, redirect, url_for, g
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import logout_user
from extensions import db
from models import User, RpcConfig
from utils import create_response, login_required_or_token
import secrets
from datetime import datetime, timedelta
from utils import create_response, login_required_or_token

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__)

# --- Token 刷新工具函数 ---
def generate_new_token(user):
    """生成新 Token 并设置过期时间(24小时)"""
    import secrets
    from datetime import datetime, timedelta
    
    new_token = f"evm-{secrets.token_hex(16)}"
    user.token = new_token
    user.token_expires_at = datetime.utcnow() + timedelta(hours=240)
    db.session.commit()
    return new_token

def is_token_expired(user):
    """检查 Token 是否过期"""
    if not user.token_expires_at:
        return True
    return datetime.utcnow() > user.token_expires_at

# --- 认证路由 ---
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册
    ---    
    tags:
      - 认证
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              description: 用户名
            password:
              type: string
              description: 密码
    responses:
      200:
        description: 注册成功
      400:
        description: 用户名已存在
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user:
        return create_response(message="用户名已存在", status_code=400, error="UserExists")
    
    new_user = User(
        username=username,
        password_hash=generate_password_hash(password),
        token=f"evm-{secrets.token_hex(16)}",
        token_expires_at=datetime.utcnow() + timedelta(hours=24),
        created_at=datetime.utcnow(),
        is_disabled=False
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return create_response(message="注册成功")

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录
    ---    
    tags:
      - 认证
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              description: 用户名
            password:
              type: string
              description: 密码
    responses:
      200:
        description: 登录成功
        schema:
          type: object
          properties:
            username:
              type: string
            token:
              type: string
      401:
        description: 用户名或密码错误
      403:
        description: 账号已被禁用
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    if user:
        if user.is_disabled:
            return create_response(message="账号已被禁用", status_code=403, error="AccountDisabled")
        
        if check_password_hash(user.password_hash, password):
            # 无论是否有旧 Token,都生成新 Token(每次登录自动刷新)
            token = generate_new_token(user)
            return create_response(message="登录成功", data={"username": username, "token": token})
    
    return create_response(message="用户名或密码错误", status_code=401, error="Unauthorized")

@auth_bp.route('/logout')
def logout():
    """
    用户登出
    ---    
    tags:
      - 认证
    security:
      - api_key: []
    responses:
      302:
        description: 登出成功，重定向到首页
      401:
        description: 未授权
    """
    logout_user()
    username = g.user_username if hasattr(g, 'user_username') else None
    if username:
        user = User.query.filter_by(username=username).first()
        if user:
            user.token = None
            db.session.commit()
    return redirect(url_for('index'))


@auth_bp.route('/api/user_info')
@login_required_or_token
def user_info():
    """
    获取用户信息
    ---    
    tags:
      - 认证
    security:
      - api_key: []
    responses:
      200:
        description: 获取用户信息成功
        schema:
          type: object
          properties:
            username:
              type: string
              description: 用户名
            token:
              type: string
              description: 用户令牌
      401:
        description: 未授权
    """
    username = g.user_username if hasattr(g, 'user_username') else None
    if not username:
        return create_response(message="未授权", status_code=401, error="Unauthorized")
    
    user = User.query.filter_by(username=username).first()
    token = user.token if user else 'No Token'
    return create_response(data={
        "username": username,
        "token": token
    })

@auth_bp.route('/api/refresh_token', methods=['POST'])
@login_required_or_token
def refresh_token():
    """
    手动刷新 API Token
    ---    
    tags:
      - 认证
    security:
      - api_key: []
    responses:
      200:
        description: Token 刷新成功
        schema:
          type: object
          properties:
            token:
              type: string
              description: 新的 API 令牌
      401:
        description: 未授权
    """
    username = g.user_username if hasattr(g, 'user_username') else None
    if not username:
        return create_response(message="未授权", status_code=401, error="Unauthorized")
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return create_response(message="用户不存在", status_code=404, error="NotFound")
    
    new_token = generate_new_token(user)
    
    return create_response(message="Token 刷新成功", data={"token": new_token})

@auth_bp.route('/api/accept_risk', methods=['POST'])
@login_required_or_token
def accept_risk():
    """
    用户同意风险协议
    ---    
    tags:
      - 认证
    security:
      - api_key: []
    responses:
      200:
        description: 同意成功
      401:
        description: 未授权
    """
    username = g.user_username if hasattr(g, 'user_username') else None
    if not username:
        return create_response(message="未授权", status_code=401, error="Unauthorized")
    
    user = User.query.filter_by(username=username).first()
    user.risk_accepted_at = datetime.utcnow()
    db.session.commit()
    
    return create_response(message="风险协议已同意")
