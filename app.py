import random
import secrets
from flask import Flask, request, jsonify, render_template, redirect, url_for, session, g
from werkzeug.security import generate_password_hash, check_password_hash
from web3 import Web3
from web3.exceptions import BadFunctionCallOutput
from web3.datastructures import AttributeDict
from hexbytes import HexBytes
import json
import os
import logging
from collections.abc import Mapping
import config as global_config
from werkzeug.utils import secure_filename
import time
import random
from flask_login import logout_user
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 导入扩展和蓝图
from extensions import db
from auth_bp import auth_bp
from config_bp import config_bp
from contract_bp import contract_bp
from history_bp import history_bp
from transaction_bp import transaction_bp
from utils import login_required_or_token, validate_json_input, create_response

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')

if not app.config['SQLALCHEMY_DATABASE_URI']:
    raise RuntimeError(
        '数据库连接失败：未配置 DATABASE_URL 环境变量。\n'
        '请设置环境变量：DATABASE_URL="mysql+pymysql://用户名:密码@主机:端口/数据库?charset=utf8mb4"'
    )
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
    'connect_args': {'connect_timeout': 10}
}

# 初始化数据库
db.init_app(app)



# 注册蓝图
app.register_blueprint(auth_bp)
app.register_blueprint(config_bp)
app.register_blueprint(contract_bp)
app.register_blueprint(history_bp)
app.register_blueprint(transaction_bp)

# --- 基础路由 ---
@app.route('/')
def index():
    """
    首页
    ---    
    tags:
      - 页面
    responses:
      200:
        description: 首页页面
    """
    return render_template('index.html')

@app.route('/usage')
def usage():
    """
    使用说明
    ---    
    tags:
      - 页面
    responses:
      200:
        description: 使用说明页面
    """
    return render_template('usage.html')

@app.route('/security')
def security():
    """
    安全与开源页面
    ---    
    tags:
      - 页面
    responses:
      200:
        description: 安全与开源页面
    """
    return render_template('security.html')

@app.route('/docs')
def docs():
    """
    文档页面
    ---    
    tags:
      - 页面
    responses:
      200:
        description: 文档页面
    """
    return render_template('docs.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
