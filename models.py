from extensions import db
from datetime import datetime

# 数据库模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(120), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_disabled = db.Column(db.Boolean, default=False)
    risk_accepted_at = db.Column(db.DateTime)

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    alias = db.Column(db.String(80), nullable=False)
    address = db.Column(db.String(120), nullable=False)
    pk_slice_server = db.Column(db.Text)
    user = db.relationship('User', backref=db.backref('accounts', lazy=True))

class RpcConfig(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    chain_id = db.Column(db.String(80), nullable=False)
    rpc_url = db.Column(db.String(200), nullable=False)
    alias = db.Column(db.String(80))
    user = db.relationship('User', backref=db.backref('rpcs', lazy=True))

class Abi(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    content = db.Column(db.JSON, nullable=False)
    user = db.relationship('User', backref=db.backref('abis', lazy=True))

class CallHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    call_id = db.Column(db.String(80), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(10), nullable=False)
    contract = db.Column(db.String(200))
    method = db.Column(db.String(200))
    args = db.Column(db.JSON)
    result = db.Column(db.JSON)
    error = db.Column(db.Text)
    chain_id = db.Column(db.String(80))
    abi_name = db.Column(db.String(80))
    user = db.relationship('User', backref=db.backref('history', lazy=True))
