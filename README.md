# EVM API Flask

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-blue)](https://palletsprojects.com/p/flask/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)

**EVM API Flask** 是一个开源的 Flask 框架 API 服务，提供与 EVM (Ethereum Virtual Machine) 兼容区块链进行交互的完整解决方案。项目采用 MIT 许可证开源，允许个人和企业免费使用、修改和分发。

## 🌟 项目简介

EVM API Flask 封装了 Web3.py 库的核心功能，通过 RESTful API 接口，允许开发者和用户通过简单的 HTTP 请求来：

- **读取链上数据**：查询智能合约的状态和变量
- **调用合约方法**：执行智能合约的 view/pure 函数
- **发送交易**：调用需要签名的写操作
- **管理账户**：支持多账户管理和私钥分片加密存储
- **配置多链**：支持自定义 RPC 和链配置
- **历史记录**：完整的调用历史追踪

**开源特性：**
- ✅ 完全开源，MIT 许可证
- ✅ 前后端分离架构
- ✅ 支持 API Token 认证
- ✅ 私钥分片加密存储（Shamir Secret Sharing）
- ✅ SSRF 防护机制
- ✅ 多语言支持（i18n）

## 📋 目录

- [项目简介](#-项目简介)
- [开源信息](#-开源信息)
- [主要功能](#-主要功能)
- [技术栈](#-技术栈)
- [二维码密保系统](#-二维码密保系统)
- [快速开始](#-快速开始)
- [配置说明](#-配置说明)
- [API 文档](#-api-文档)
- [数据库模型](#-数据库模型)
- [项目结构](#-项目结构)
- [安全考虑](#-安全考虑)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)

## 🎯 主要功能

### 合约交互
- ✅ 读取合约数据 (`/read_contract`)
- ✅ 写入合约数据 (`/write_contract`)
- ✅ 获取合约事件 (`/get_events`)
- ✅ 解码交易数据 (`/decode_transaction`)
- ✅ 获取交易回执 (`/get_transaction_receipt`)

### 账户管理
- ✅ 多账户支持
- ✅ 账户别名管理
- ✅ 私钥分片加密存储（服务器端）
- ✅ 前端私钥分片（Shamir Secret Sharing）

### RPC 配置
- ✅ 多链支持
- ✅ 自定义 RPC URL
- ✅ 链 ID 和别名配置
- ✅ SSRF 防护（禁止内网/本地 RPC）

### 安全特性
- ✅ 用户认证（注册/登录）
- ✅ API Token 认证
- ✅ 密码哈希存储
- ✅ 私钥分片加密（Shamir Secret Sharing）
- ✅ SSRF 防护
- ✅ 输入验证
- ✅ XSS 防护（DOMPurify）
- ✅ 二维码密保系统
- ✅ 私钥分片物理备份
- ✅ 前端加密传输

### 其他功能
- ✅ 调用历史记录
- ✅ ABI 管理（上传/删除/查询）
- ✅ 风险协议确认
- ✅ 多语言界面
- ✅ RSA 公钥加密传输
- ✅ 二维码密保系统（备份/恢复）
- ✅ 交易功能支持
- ✅ 反馈日志系统

## 🛠 技术栈

### 后端
- **Flask 2.3.3** - Web 框架
- **Flask-SQLAlchemy 3.0.5** - ORM
- **Flask-Login 0.6.3** - 用户认证
- **web3.py 7.14.0** - EVM 交互
- **PyMySQL 1.1.2** - MySQL 连接
- **python-dotenv 1.1.0** - 环境变量
- **cryptography 41.0.7** - 加密库
- **flasgger 0.9.5** - API 文档
- **Werkzeug 3.1.3** - WSGI 工具
- **SQLAlchemy 2.0.39** - 数据库 ORM

### 前端
- **ethers.js 6.9.0** - Ethereum 库
- **Bootstrap 5** - UI 框架
- **DOMPurify 3.0.6** - XSS 防护
- **jsencrypt 3.3.2** - RSA 加密
- **i18next** - 国际化
- **qrcode.js** - 二维码生成
- **jsQR** - 二维码识别
- **html5-qrcode** - 摄像头扫码

### 数据库
- **MySQL** - 关系型数据库

## 🔐 二维码密保系统

### 概述

EVM API Flask 集成了创新的二维码密保系统，通过二维码技术实现私钥分片的便捷备份和恢复。该方案完全在前端完成，确保私钥分片 never 离开您的浏览器。

### 核心功能

#### 备份账户
1. 登录账号
2. 点击"添加账户"
3. 输入私钥和地址
4. 点击"保存账户"
5. ✅ **系统自动生成密保二维码**
6. 点击"下载密保图片"
7. 打印或存入物理加密U盘

#### 恢复账户
1. 登录账号
2. 找到需要恢复的账户
3. 点击"恢复"按钮
4. 选择恢复方式：
   - **PC端**：上传二维码图片
   - **手机端**：开启摄像头扫码
5. ✅ **系统自动同步并重新分片**
6. 设置新密码

### 技术架构

- **数据格式**：JSON 格式存储账户别名和切片信息
- **生成工具**：qrcode.js 生成二维码
- **识别工具**：jsQR（PC端图片识别）、html5-qrcode（手机端摄像头）
- **安全机制**：前端加密，私钥分片永不离开浏览器

## 🚀 快速开始

### 环境要求

- Python 3.8+
- MySQL 5.7+
- pip 包管理器

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/xiaoqi1998/evm_api_flask.git
cd evm_api_flask
```

2. **创建虚拟环境**（推荐）

```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. **安装依赖**

```bash
pip install -r requirements.txt
```

4. **配置数据库**

创建 MySQL 数据库并配置环境变量：

```bash
export DATABASE_URL="mysql+pymysql://用户名:密码@主机:端口/数据库?charset=utf8mb4"
# Windows (PowerShell)
$env:DATABASE_URL="mysql+pymysql://用户名:密码@主机:端口/数据库?charset=utf8mb4"
```

5. **初始化数据库**

```bash
python migrate.py
```

或使用 Flask-Migrate：

```bash
flask db init
flask db migrate
flask db upgrade
```

6. **启动服务**

```bash
python app.py
```

服务将在 `http://0.0.0.0:5002/` 上运行。

## ⚙️ 配置说明

### 环境变量

项目使用环境变量进行配置，推荐使用 `.env` 文件：

```env
DATABASE_URL="mysql+pymysql://用户名:密码@主机:端口/数据库?charset=utf8mb4"
SECRET_KEY="your-secret-key-here"
```

### 数据库配置

项目使用 SQLAlchemy 连接 MySQL 数据库。确保数据库已创建并配置正确的字符集（utf8mb4）。

### 安全配置

- **SECRET_KEY**: 用于会话加密，生产环境必须设置强密钥
- **DATABASE_URL**: 数据库连接字符串
- **私钥存储**: 使用 Shamir Secret Sharing 分片存储

## 📚 API 文档

### 基础信息

- **Base URL**: `http://localhost:5002`
- **Content-Type**: `application/json`
- **认证方式**: `X-API-Token` 请求头

### 通用响应格式

```json
{
  "status": "success|error",
  "message": "描述信息",
  "data": { ... },
  "error": "错误类型",
  "details": "详细错误信息"
}
```

### 认证 API

#### POST `/register` - 用户注册

**请求体：**
```json
{
  "username": "user123",
  "password": "password123"
}
```

**响应：**
```json
{
  "status": "success",
  "message": "注册成功"
}
```

#### POST `/login` - 用户登录

**请求体：**
```json
{
  "username": "user123",
  "password": "password123"
}
```

**响应：**
```json
{
  "status": "success",
  "message": "登录成功",
  "data": {
    "username": "user123",
    "token": "evm-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

#### GET `/api/user_info` - 获取用户信息

**请求头：**
```
X-API-Token: your-token-here
```

**响应：**
```json
{
  "status": "success",
  "data": {
    "username": "user123",
    "token": "evm-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

#### POST `/api/accept_risk` - 同意风险协议

**请求头：**
```
X-API-Token: your-token-here
```

**响应：**
```json
{
  "status": "success",
  "message": "风险协议已同意"
}
```

### 合约交互 API

#### POST `/contract/read_contract` - 读取合约数据

**请求体：**
```json
{
  "contract_address": "0x...",
  "abi_name": "MyContract",
  "method_name": "getData",
  "args": ["param1", 123],
  "chain_id": 84532,
  "rpc_url": "https://rpc.example.com"
}
```

**响应：**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "result": "..."
  }
}
```

#### POST `/contract/write_contract` - 写入合约

**请求体：**
```json
{
  "raw_transaction": "0xf8...",
  "contract_address": "0x...",
  "abi_name": "MyContract",
  "method_name": "setData",
  "args": ["newValue"],
  "chain_id": 84532
}
```

**响应：**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "transaction_hash": "0x..."
  }
}
```

#### POST `/contract/get_events` - 获取合约事件

**请求体：**
```json
{
  "contract_address": "0x...",
  "abi_name": "MyContract",
  "event_name": "Transfer",
  "from_block": 0,
  "to_block": "latest",
  "argument_filters": {
    "from": "0x..."
  },
  "chain_id": 84532
}
```

#### POST `/contract/get_abi_details` - 获取 ABI 详情

**查询参数：**
```
?abi_name=MyContract
```

**响应：**
```json
{
  "status": "success",
  "data": {
    "details": {
      "functions": [...],
      "events": [...],
      "errors": [...]
    },
    "full_abi": [...]
  }
}
```

### 交易 API

#### POST `/transaction/write_contract` - 发送交易

与 `/contract/write_contract` 功能相同。

#### POST `/transaction/get_transaction_receipt` - 获取交易回执

**请求体：**
```json
{
  "transaction_hash": "0x...",
  "chain_id": 84532
}
```

#### POST `/transaction/decode_transaction` - 解码交易

**请求体：**
```json
{
  "transaction_hash": "0x...",
  "abi_name": "MyContract"
}
```

### 账户管理 API

#### GET `/config/get_configs` - 获取配置

**响应：**
```json
{
  "status": "success",
  "data": {
    "accounts": ["my_acc", "my_acc2"],
    "chains": [
      {
        "chain_id": "84532",
        "alias": "base-sepolia",
        "rpc_url": "https://..."
      }
    ]
  }
}
```

#### POST `/config/add_account` - 添加账户

**请求体：**
```json
{
  "alias": "my_acc",
  "address": "0x...",
  "pk_slice_server": "..."
}
```

#### GET `/config/api/accounts` - 获取账户列表

#### DELETE `/config/api/accounts/:alias` - 删除账户

#### POST `/config/api/rpcs` - 添加 RPC

**请求体：**
```json
{
  "chain_id": "84532",
  "rpc_url": "https://...",
  "alias": "base-sepolia"
}
```

#### DELETE `/config/api/rpcs/:chain_id` - 删除 RPC

#### GET `/config/api/public_key` - 获取 RSA 公钥

**响应：**
```json
{
  "status": "success",
  "data": {
    "public_key": "-----BEGIN PUBLIC KEY-----\n..."
  }
}
```

### 历史记录 API

#### GET `/history/api/history` - 获取调用历史

**响应：**
```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "id": 1,
        "call_id": "xxxx",
        "timestamp": "2026-03-09T10:00:00",
        "type": "read",
        "contract": "0x...",
        "method": "getData",
        "args": [...],
        "result": {...},
        "error": null,
        "chain_id": "84532",
        "abi_name": "MyContract"
      }
    ]
  }
}
```

#### POST `/history/api/history/clear` - 清空历史

#### POST `/contract/api/history/clear` - 清空历史（备用）

## 🗄️ 数据库模型

### User（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| username | String(80) | 用户名（唯一） |
| password_hash | String(255) | 密码哈希 |
| token | String(120) | API Token |
| token_expires_at | DateTime | Token 过期时间 |
| created_at | DateTime | 创建时间 |
| is_disabled | Boolean | 是否禁用 |
| risk_accepted_at | DateTime | 风险协议同意时间 |

### Account（账户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| user_id | Integer | 用户ID（外键） |
| alias | String(80) | 账户别名 |
| address | String(120) | 钱包地址 |
| pk_slice_server | Text | 服务器端私钥分片 |

### RpcConfig（RPC配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| user_id | Integer | 用户ID（外键，可为空，表示全局配置） |
| chain_id | String(80) | 链ID |
| rpc_url | String(200) | RPC URL |
| alias | String(80) | 链别名 |

### Abi（ABI表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| user_id | Integer | 用户ID（外键） |
| name | String(80) | ABI名称 |
| content | JSON | ABI内容 |

### CallHistory（调用历史表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| user_id | Integer | 用户ID（外键） |
| call_id | String(80) | 调用ID |
| timestamp | DateTime | 时间戳 |
| type | String(10) | 类型（read/write） |
| contract | String(200) | 合约地址 |
| method | String(200) | 方法名 |
| args | JSON | 参数 |
| result | JSON | 结果 |
| error | Text | 错误信息 |
| chain_id | String(80) | 链ID |
| abi_name | String(80) | ABI名称 |

### FeedbackLog（反馈日志表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| user_id | Integer | 用户ID（外键） |
| timestamp | DateTime | 反馈时间 |
| feedback_type | String(50) | 反馈类型 |
| message | Text | 反馈内容 |
| metadata | JSON | 元数据 |

## 📁 项目结构

```
evm_api_flask/
├── app.py                 # 主应用入口
├── config.py              # 全局配置和 RPC 设置
├── models.py              # 数据库模型定义
├── extensions.py          # Flask 扩展初始化
├── create_tables.py       # 数据库表创建脚本
├── migrate.py             # 数据库迁移脚本
├── requirements.txt        # Python 依赖包
├── Dockerfile             # Docker 容器配置
├── .dockerignore          # Docker 忽略文件
├── .gitignore             # Git 忽略文件
├── README.md              # 项目文档
├── PUT_ROUTE_UPDATE.md    # PUT 路由更新说明
├── QR_BACKUP_README.md    # 二维码备份系统文档
├── QR_BACKUP_SUMMARY.md   # 二维码备份功能总结
├── QR_QUICK_REFERENCE.md  # 二维码功能快速参考
├── auth_bp.py             # 认证蓝图
├── config_bp.py          # 配置管理蓝图
├── contract_bp.py         # 合约交互蓝图
├── history_bp.py          # 历史记录蓝图
├── transaction_bp.py      # 交易功能蓝图
├── utils.py               # 工具函数
└── static/                # 静态文件
    ├── index.js           # 主前端逻辑
    ├── style.css          # 样式文件
    ├── EVM.png            # 项目图标
    ├── test-qr.html       # 二维码测试页面
    ├── css/
    │   └── style.css      # 样式文件
    └── js/
        ├── api.js         # API 调用封装
        ├── crypto-utils.js # 加密工具函数
        ├── i18n.js        # 国际化支持
        ├── qrcode-utils.js # 二维码工具函数
        ├── ui.js          # UI 交互函数
        └── wallet.js      # 钱包相关功能
```

## 🔒 安全考虑

### 已实现的安全措施

1. **密码安全**
   - 使用 Werkzeug 的 `generate_password_hash` 进行密码哈希
   - 支持密码强度验证

2. **私钥安全**
   - Shamir Secret Sharing 秘密共享算法
   - 私钥分片存储（前端 + 服务器）
   - 单独分片无法还原完整私钥
   - 二维码密保系统确保私钥分片永不离开浏览器

3. **网络攻击防护**
   - SSRF 防护（禁止内网/本地 RPC URL）
   - XSS 防护（DOMPurify）
   - 输入验证

4. **认证安全**
   - API Token 认证
   - 会话管理
   - 账户禁用机制

5. **二维码密保安全**
   - 二维码数据仅包含账户别名和切片信息
   - 不包含完整的私钥或敏感数据
   - 支持版本控制，便于未来升级
   - 物理备份提供额外的安全层

6. **传输安全**
   - 推荐在生产环境使用 HTTPS
   - 敏感数据使用 RSA 加密传输
   - 前端使用 jsencrypt 库进行加密
   - 二维码数据传输采用 JSON 格式，包含版本控制

7. **数据库安全**
   - 参数化查询防止 SQL 注入
   - 连接池管理
   - 超时设置
   - 反馈日志系统记录用户操作

### 生产环境建议

1. 使用环境变量管理敏感信息
2. 启用 HTTPS
3. 设置强 SECRET_KEY
4. 定期更新依赖
5. 启用日志审计
6. 配置防火墙规则
7. 使用专用数据库用户
8. 启用 CORS 限制

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发指南

1. 安装开发依赖
2. 运行测试
3. 确保代码符合风格规范
4. 更新文档

### 代码风格

- Python: PEP 8
- JavaScript: ESLint (推荐)
- 使用类型提示（可选）

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

```
MIT License

Copyright (c) 2026 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## ⚠️ 免责声明

**重要提示：**

1. 本软件按"原样"提供，不提供任何形式的担保
2. 使用本软件进行区块链交互存在风险
3. 请妥善保管您的私钥和助记词
4. 建议在测试网先行测试
5. 生产环境使用前请进行充分的安全审计

**私钥安全警告：**

- 本项目采用私钥分片存储方案
- 单独的分片无法还原完整私钥
- 但仍需注意：服务器端分片存储存在潜在风险
- 生产环境建议使用更安全的密钥管理方案（HSM、KMS 等）

## 📞 联系方式

- GitHub Issues: [https://github.com/xiaoqi1998/evm_api_flask/issues](https://github.com/xiaoqi1998/evm_api_flask/issues)
- Email: [你的邮箱]

## 🙏 致谢

- [Web3.py](https://github.com/ethereum/web3.py) - Ethereum Python API
- [Flask](https://github.com/pallets/flask) - Python Web Framework
- [ethers.js](https://github.com/ethers-io/ethers.js/) - Ethereum JavaScript API
- [Bootstrap](https://github.com/twbs/bootstrap) - UI Framework

---

⭐ 如果这个项目对你有帮助，请给它点个 star！