---
name: "flask-evm-documenter"
description: "提供 EVM API Flask 项目的完整代码说明和架构文档。在编写或修改代码时必须参考此文档，确保代码符合项目规范和架构设计。"
---

# EVM API Flask 项目代码说明

## 📋 项目概述

**EVM API Flask** 是一个基于 Flask 的以太坊虚拟机 API 服务，提供安全的区块链交互接口。

### 核心功能
- 🔐 用户认证与 Token 管理
- 🔗 多链 RPC 配置管理
- 📝 智能合约交互
- 📊 交易历史记录
- 🔒 安全私钥分片存储

## 🏗️ 项目架构

### 目录结构
```
evm_api_flask/
├── app.py                 # 主应用入口
├── models.py              # 数据库模型
├── utils.py               # 工具函数
├── extensions.py          # Flask 扩展
├── config.py             # 配置文件
├── auth_bp.py            # 认证蓝图
├── config_bp.py          # 配置管理蓝图
├── contract_bp.py        # 合约交互蓝图
├── history_bp.py         # 历史记录蓝图
├── transaction_bp.py     # 交易蓝图
└── templates/            # 前端模板
```

## 🔧 核心组件说明

### 1. 主应用 (app.py)
**功能**: Flask 应用初始化和路由注册
**关键配置**:
- `SECRET_KEY`: 应用密钥，从环境变量获取
- `SQLALCHEMY_DATABASE_URI`: 数据库连接字符串
- 蓝图注册顺序: auth → config → contract → history → transaction

**启动参数**:
```python
app.run(host='0.0.0.0', port=5002)  # 生产环境移除 debug=True
```

### 2. 数据模型 (models.py)
**User 模型**:
- `username`: 用户名(唯一)
- `password_hash`: 密码哈希
- `token`: API Token(唯一)
- `token_expires_at`: Token 过期时间
- `is_disabled`: 账号禁用状态
- `risk_accepted_at`: 风险协议接受时间

**Account 模型**:
- `alias`: 账户别名
- `address`: 区块链地址
- `pk_slice_server`: 私钥分片(服务器存储)

**RpcConfig 模型**:
- `chain_id`: 链 ID
- `rpc_url`: RPC 端点
- `alias`: 链别名

### 3. 认证系统 (auth_bp.py)
**Token 管理机制**:
- 每次登录自动刷新 Token
- Token 24小时过期
- 支持手动刷新 `/api/refresh_token`

**关键函数**:
- `generate_new_token()`: 生成新 Token
- `is_token_expired()`: 检查 Token 过期

**认证装饰器**:
- `@login_required_or_token`: 检查 X-API-Token

### 4. 工具函数 (utils.py)
**核心功能**:
- `create_response()`: 统一响应格式
- `get_web3_instance()`: Web3 实例创建
- `is_safe_public_rpc_url()`: RPC URL 安全检查
- `convert_to_json_serializable()`: 数据序列化

**安全特性**:
- SSRF 防护: 禁止访问本地/内网 RPC
- 输入验证: ABI 类型转换和参数校验

### 5. 配置管理 (config_bp.py)
**账户管理**:
- 支持多账户别名管理
- 私钥分片存储
- 账户增删改查

**RPC 管理**:
- 默认 RPC 配置(全局)
- 用户自定义 RPC
- 链别名支持

## 🔐 安全规范

### 1. Token 安全
- 随机生成: `evm-{secrets.token_hex(16)}`
- 自动过期: 24小时有效期
- 单点登录: 每次登录刷新 Token

### 2. 数据库安全
- 密码哈希存储
- 私钥分片存储
- SQL 注入防护(SQLAlchemy)

### 3. 网络安全
- SSRF 防护: 禁止本地 RPC
- HTTPS 支持: 生产环境启用 SSL
- 输入验证: 严格的参数校验

## 📊 API 设计规范

### 响应格式
```json
{
  "status": "success/error",
  "message": "操作结果描述",
  "data": {},
  "error": "错误代码",
  "details": "错误详情"
}
```

### 认证方式
- Header: `X-API-Token: <token>`
- 过期处理: 返回 401 状态码

### 错误处理
- 400: 参数错误
- 401: 认证失败
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器错误

## 🔄 开发规范

### 代码风格
- 函数注释使用 docstring
- 变量命名使用 snake_case
- 类名使用 PascalCase

### 数据库操作
- 使用 SQLAlchemy ORM
- 事务管理: `db.session.commit()`
- 错误重试: `@retry_on_db_error()`

### 蓝图设计
- 每个功能模块独立蓝图
- 路由前缀清晰
- 权限控制统一

## 🚀 部署注意事项

### 环境变量
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=mysql+pymysql://user:pass@host:port/db
```

### 生产配置
- 移除 `debug=True`
- 使用 Gunicorn + Nginx
- 启用 HTTPS
- 配置数据库连接池

## 📝 代码修改指南

### 新增功能
1. 检查是否需要新增数据库字段
2. 创建对应的蓝图路由
3. 添加输入验证和错误处理
4. 更新 API 文档

### 修改现有功能
1. 参考相关蓝图和模型
2. 保持 API 兼容性
3. 更新对应的测试用例
4. 修改后运行数据库迁移

### 安全更新
1. 检查 Token 生成逻辑
2. 验证输入参数安全
3. 测试 RPC URL 防护
4. 更新密码哈希算法(如需要)

---

**重要**: 每次代码修改前必须参考此文档，确保符合项目架构和安全规范。