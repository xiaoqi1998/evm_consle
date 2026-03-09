# EVM API Flask

## 项目简介

EVM API Flask 是一个基于 Flask 框架构建的 API 服务，旨在提供与 EVM (Ethereum Virtual Machine) 兼容区块链进行交互的接口。它封装了 Web3.py 库的功能，允许用户通过简单的 HTTP 请求来读取智能合约数据、调用智能合约方法以及发送交易。

**主要功能:**
*   **读取合约数据**: 通过合约地址、ABI 和方法名读取链上数据。
*   **调用合约方法**: 执行智能合约的写操作，发送交易到区块链。
*   **灵活配置**: 支持通过 `config.py` 配置 Web3 提供者 URL、私钥和发送者地址。

## 如何使用

本项目提供了一系列 RESTful API 接口，允许您通过 HTTP 请求与 EVM 兼容的区块链进行交互。

### 运行项目

1.  **安装依赖**: 确保您已安装所有必要的 Python 依赖。
2.  **配置**: 根据您的区块链网络和需求配置 `config.py` 文件。
3.  **启动服务**:
    ```bash
    python app.py
    ```
    服务将在 `http://127.0.0.1:5002/` 上运行（如果 `app.py` 中配置的端口是 5002）。应用。

## 安装

1.  **克隆仓库**:
    ```bash
    git clone <仓库地址>
    cd evm_api_flask
    ```
2.  **创建并激活虚拟环境** (推荐):
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  **安装依赖**:
    由于 `requirements.txt` 文件不存在，请手动安装 `Flask` 和 `web3` 库：
    ```bash
    pip install Flask web3
    ```
    如果项目有其他依赖，请根据实际情况安装。

## 配置

项目配置通过 `config.py` 文件管理。您需要根据您的区块链网络和需求修改以下变量：

*   `WEB3_PROVIDER_URL`: 您的 EVM 兼容区块链的 RPC URL。例如：`"https://api.zan.top/node/v1/base/sepolia/6ef49f71388347d89857452779586df9"`。
*   `PRIVATE_KEY`: 用于发送交易的账户私钥。**在生产环境中，请务必安全管理您的私钥，例如使用环境变量或密钥管理服务。**
*   `SENDER_ADDRESS`: 发送交易的账户地址。

**示例 `config.py`:**
```python
# Configuration for EVM API

WEB3_PROVIDER_URL="https://api.zan.top/node/v1/base/sepolia/6ef49f71388347d89857452779586df9"
PRIVATE_KEY = "0x1ade2042682c111a5afd62f7419850eb9f1e8f81"
SENDER_ADDRESS = "5cc1188126ea098eb07b0e6881411b7c9f40cf2451af7074a6fa93abcf5de143"
```

## API 文档

### `/` (GET)
*   **描述**: 返回一个简单的 "Hello, World!" 消息，用于测试服务是否正常运行。
*   **响应**:
    ```
    "Hello, World!"
    ```

### `/read_contract` (POST)
*   **描述**: 从 EVM 链上的智能合约读取数据。
*   **参数**:
    *   `contract_address` (string, 必填): 智能合约的地址。
    *   `abi_name` (string, 必填): 位于 `abi` 目录下的 ABI 文件名（不带 `.json` 扩展名）。
    *   `method_name` (string, 必填): 要调用的合约方法名。
    *   `args` (list, 可选): 传递给合约方法的参数列表。
*   **示例请求体**:
    ```json
    {
        "contract_address": "0x...",
        "abi_name": "MyContract",
        "method_name": "getData",
        "args": ["param1", 123]
    }
    ```
*   **示例成功响应**:
    ```json
    {
        "status": "success",
        "message": "Success",
        "data": {
            "result": "..."
        }
    }
    ```
*   **示例错误响应**:
    ```json
    {
        "status": "error",
        "message": "ABI file not found",
        "error": "ABI file not found",
        "details": "ABI file not found: /path/to/abi/MyContract.json"
    }
    ```

### `/time_contract` (POST)
*   **描述**: 调用智能合约方法，通常涉及读取操作，类似于 `read_contract`。此命名可能暗示用于时间敏感的合约交互或查询。
*   **参数**:
    *   `contract_address` (string, 必填): 智能合约的地址。
    *   `abi_name` (string, 必填): 位于 `abi` 目录下的 ABI 文件名（不带 `.json` 扩展名）。
    *   `method_name` (string, 必填): 要调用的合约方法名。
    *   `args` (list, 可选): 传递给合约方法的参数列表。
*   **示例请求体**:
    ```json
    {
        "contract_address": "0x...",
        "abi_name": "MyContract",
        "method_name": "getTime",
        "args": []
    }
    ```
*   **示例成功响应**:
    ```json
    {
        "status": "success",
        "message": "Success",
        "data": {
            "result": "..."
        }
    }
    ```
*   **示例错误响应**:
    ```json
    {
        "status": "error",
        "message": "Invalid contract address or method",
        "error": "Invalid contract address or method",
        "details": "..."
    }
    ```

### `/write_contract` (POST)
*   **描述**: 向 EVM 链上的智能合约写入数据，这涉及发送交易。需要配置 `PRIVATE_KEY` 和 `SENDER_ADDRESS`。
*   **参数**:
    *   `contract_address` (string, 必填): 智能合约的地址。
    *   `abi_name` (string, 必填): 位于 `abi` 目录下的 ABI 文件名（不带 `.json` 扩展名）。
    *   `method_name` (string, 必填): 要调用的合约方法名。
    *   `args` (list, 可选): 传递给合约方法的参数列表。
*   **示例请求体**:
    ```json
    {
        "contract_address": "0x...",
        "abi_name": "MyContract",
        "method_name": "setData",
        "args": ["newValue"]
    }
    ```
*   **示例成功响应**:
    ```json
    {
        "status": "success",
        "message": "Success",
        "data": {
            "tx_hash": "0x..."
        }
    }
    ```
*   **示例错误响应**:
    ```json
    {
        "status": "error",
        "message": "Server-side configuration error",
        "error": "Server-side configuration error",
        "details": "PRIVATE_KEY or SENDER_ADDRESS not set."
    }
    ```

### `/test` (GET)
*   **描述**: 一个测试接口，返回预定义的 JSON 对象。
*   **响应**:
    ```json
    {
        "code": 0,
        "data": {
            "list": [
                {
                    "id": "3250492430007",
                    "timestamp": 1764567540862,
                    "points": 100,
                    "descr": "Bought EDS worth 33 USDT"
                }
            ]
        },
        "msg": "success"
    }
    ```
