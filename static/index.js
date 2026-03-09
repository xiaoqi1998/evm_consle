
        // ==========================================
        // 0. 导入依赖
        // ==========================================
        console.log('版本V1.0.5，更新日期2026-03-09 10:17');
        
        // 导入 ethers.js v6
        if (typeof ethers === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.9.0/ethers.umd.min.js';
            document.head.appendChild(script);
        }
        
        // 导入 api.js
        if (typeof accountAPI === 'undefined') {
            const script = document.createElement('script');
            script.src = '/static/js/api.js';
            document.head.appendChild(script);
        }
        
        // 导入 crypto-utils.js（包含 Shamir 和 SecureStorage）
        if (typeof Shamir === 'undefined') {
            const script = document.createElement('script');
            script.src = '/static/js/crypto-utils.js';
            document.head.appendChild(script);
        }
        
        // 导入 DOMPurify
        if (typeof DOMPurify === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js';
            document.head.appendChild(script);
        }
        
        // 导入 JSEncrypt 库
        if (typeof JSEncrypt === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsencrypt@3.3.2/bin/jsencrypt.min.js';
            document.head.appendChild(script);
        }
        
        // ==========================================
        // 0. API Token 拦截器
        // ==========================================
        const originalFetch = window.fetch;
        let cachedPublicKey = null;
        
        async function getPublicKey() {
            if (cachedPublicKey) return cachedPublicKey;
            const res = await fetch('/api/public_key');
            const data = await res.json();
            if (data.status === 'success') {
                cachedPublicKey = data.data.public_key;
                return cachedPublicKey;
            }
            throw new Error('Failed to get public key');
        }
        
        window.fetch = async (...args) => {
            const token = localStorage.getItem('evm_api_token');
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;

            if (token) {
                // 如果只有一个参数 (URL)
                if (args.length === 1) {
                    args[1] = { headers: { 'X-API-Token': token } };
                } else {
                    if (!args[1]) args[1] = {};
                    if (!args[1].headers) args[1].headers = {};
                    
                    if (args[1].headers instanceof Headers) {
                        args[1].headers.set('X-API-Token', token);
                    } else {
                        args[1].headers['X-API-Token'] = token;
                    }
                }
            }
            const res = await originalFetch(...args);
            
            // 401 处理：排除登录、注册和用户信息接口
            if (res.status === 401) {
                const isAuthApi = url.includes('/login') || url.includes('/register') || url.includes('/api/user_info');
                if (!isAuthApi) {
                    console.warn('Unauthorized request, clearing token and reloading...');
                    localStorage.removeItem('evm_api_token');
                    window.location.reload();
                }
            }
            return res;
        };

        // ==========================================
        // 1. 用户认证与初始化逻辑
        // ==========================================
        let currentUser = null;
        let isLoginMode = true;
        let currentLang = localStorage.getItem('lang') || 'zh';
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));

        const translations = {
            'zh': {
                'nav_title': 'EVM API 控制面板',
                'config_center': '配置中心',
                'account_alias': '账户别名',
                'rpc_alias': '链/RPC 别名',
                'btn_add_config': '添加配置',
                'abi_mgmt': 'ABI 管理',
                'btn_upload_abi': '上传 ABI',

                'tab_interact': '合约交互',
                'tab_tools': '辅助工具',
                'tab_events': '事件日志',
                'contract_addr': '合约地址',
                'chain_rpc': '链/RPC',
                'btn_load_methods': '加载方法',
                'method_list': '方法列表:',
                'send_options': '发送选项 (Write Only):',
                'btn_execute': '执行方法',
                'exec_result': '执行结果:',
                'waiting': '等待执行...',
                'tool_receipt': '获取交易回执',
                'tx_hash': '交易哈希',
                'btn_query_receipt': '查询回执',
                'result_here': '结果将在此显示...',
                'tool_decode': '解码交易数据',
                'encoded_data': '编码数据 (Input Data)',
                'related_abi': '对应 ABI',
                'btn_decode': '解码数据',
                'event_name': '事件名称',
                'from_block': '起始区块',
                'to_block': '结束区块',
                'param_filter': '参数过滤 (JSON)',
                'btn_query_events': '查询事件',
                'account_config': '账户配置',
                'rpc_config': 'RPC 节点',
                'abi_config': 'ABI 管理',
                'connect_metamask': '连接 MetaMask',
                'upload_abi': '上传 ABI',
                'add_account': '添加账户',
                'add_rpc': '添加 RPC',
                'history_title': '调用历史记录',
                'btn_refresh_history': '刷新',
                'btn_clear_history': '清空',
                'time': '时间',
                'type': '类型',
                'method': '方法/合约',
                'params': '参数',
                'result': '结果/错误',
                'actions': '操作',
                'btn_recall': '重新调用',
                'pill_acc': '账户',
                'pill_rpc': 'RPC',
                'alias': '别名',
                'pk': '私钥',
                'addr': '地址',
                'btn_save_acc': '保存账户',
                'chain_id': '链 ID',
                'btn_save_rpc': '保存 RPC',
                'abi_name': 'ABI 名称',
                'abi_content': 'ABI 内容',
                'btn_upload': '上传',
                'lang_btn': 'English',
                'no_account_msg': '暂无账户配置，请添加',
                'add_acc_prompt': '点击"添加配置"按钮来添加您的第一个钱包账户。',
                'btn_connect_mm': '连接 MetaMask',
                'btn_disconnect_mm': '断开 MetaMask',
                'mm_disconnected': '未连接 MetaMask',
                'mm_connected': '已连接 MetaMask',
                'connect_metamask': '连接 MetaMask',

                // Security page
                'security_title': '安全机制与开源代码 - EVM API 控制面板',
                'security_desc': 'EVM API 控制面板安全机制说明和开源代码展示',
                'security_keywords': '安全机制, 开源代码, 私钥加密, Shamir\'s Secret Sharing, EVM API',
                'back_home': '返回首页',
                'usage_guide': '使用说明',
                'toc_title': '目录',
                'overview': '安全机制概述',
                'shamir': 'Shamir\'s Secret Sharing',
                'encryption': 'AES-256-GCM 加密',
                'secure_storage': 'SecureStorage 模块',
                'source_code': '开源代码展示',
                'security_features': '核心安全特性',
                'faq': '常见问题',
                'security_overview': '安全机制概述',
                'security_overview_desc': '本工具高度重视用户资产安全，采用业界领先的加密技术和分片存储方案，确保您的私钥永远不会以明文形式暴露。',
                'end_to_end': '端到端加密',
                'fully_open': '完全开源',
                'key_sharding': '私钥分片',
                'why_secure_title': '为什么输入私钥是安全的？',
                'security_point_1_title': '1. 私钥 never 离开您的浏览器',
                'security_point_1_desc': '所有加密操作都在您的本地浏览器中完成，私钥 never 以明文形式发送到服务器。',
                'security_point_2_title': '2. Shamir\'s Secret Sharing 分片技术',
                'security_point_2_desc': '私钥被分割成多个片段，分别存储在浏览器本地和服务器。即使攻击者同时获取两端数据，也无法还原原始私钥。',
                'security_point_3_title': '3. AES-256-GCM 强加密',
                'security_point_3_desc': '浏览器端使用 AES-256-GCM 算法加密私钥片段，密钥由您的密码通过 PBKDF2 派生，强度极高。',
                'security_point_4_title': '4. 服务器无法还原私钥',
                'security_point_4_desc': '服务器仅存储加密后的片段，且缺少浏览器端的加密密钥，因此无法还原原始私钥。',
                'shamir_title': 'Shamir\'s Secret Sharing 分片算法',
                'shamir_desc': 'Shamir\'s Secret Sharing 是一种密码学算法，可以将一个秘密（如私钥）分割成多个片段，只有达到一定数量的片段才能还原原始秘密。',
                'how_it_works': '工作原理：',
                'shamir_point_1': '将私钥分割成 <strong>N</strong> 个片段',
                'shamir_point_2': '设置阈值 <strong>K</strong>（K ≤ N）',
                'shamir_point_3': '需要至少 <strong>K</strong> 个片段才能还原私钥',
                'shamir_point_4': '少于 <strong>K</strong> 个片段无法获取任何信息',
                'storage_strategy': '分片存储策略：',
                'browser_side': '浏览器端',
                'server_side': '服务器端',
                'storage_content': '存储内容：',
                'browser_storage_content': '加密后的私钥片段',
                'server_storage_content': '未加密的私钥片段',
                'encrypt_key': '加密密钥：',
                'browser_encrypt_key': '由您的密码派生（PBKDF2）',
                'server_encrypt_key': '无',
                'key': '密钥：',
                'security': '安全性：',
                'browser_security': '只有您知道密码，密钥无法被破解',
                'server_security': '单独的片段无法还原私钥',
                'practical_example': '实际应用示例：',
                'encryption_title': 'AES-256-GCM 加密算法',
                'encryption_desc': 'AES-256-GCM 是一种先进的对称加密算法，提供机密性、完整性和认证性保护。',
                'key_256': '256 位密钥',
                'key_256_desc': '2^256 种可能，暴力破解需要宇宙年龄的时间',
                'gcm_mode': 'GCM 模式',
                'gcm_mode_desc': '提供认证加密，防止密文被篡改',
                'random_iv': '随机 IV',
                'random_iv_desc': '每次加密使用不同的初始化向量',
                'key_derivation': '密钥派生（PBKDF2）：',
                'key_derivation_desc': '您的登录密码通过 PBKDF2 算法派生出 AES 加密密钥，包含以下安全特性：',
                'iterations_600k': '600,000 次迭代',
                'iterations_600k_desc': '：增加暴力破解成本',
                'salt_value': 'Salt 值',
                'salt_value_desc': '：防止彩虹表攻击',
                'sha256_hash': 'SHA-256 哈希',
                'sha256_hash_desc': '：确保密钥强度',
                'secure_storage_title': 'SecureStorage 模块源码',
                'secure_storage_desc': '以下是从 <code>crypto-utils.js</code> 中提取的 SecureStorage 核心代码，展示了私钥的加密存储过程：',
                'encrypt_storage': '1. 私钥加密存储（saveEncryptedSlice）',
                'decrypt_storage': '2. 私钥解密读取（getDecryptedSlice）',
                'session_cache': '3. Session 缓存机制',
                'key_security_features': '关键安全特性：',
                'key_security_1': '<strong>密码 never 存储</strong>',
                'key_security_1_title': '密码 never 存储',
                'key_security_1_desc': '：密码仅用于派生密钥，不保存在任何地方',
                'key_security_2': '<strong>Session 自动过期</strong>',
                'key_security_2_title': 'Session 自动过期',
                'key_security_2_desc': '：30 分钟后需要重新输入密码',
                'key_security_3': '<strong>手动锁定功能</strong>',
                'key_security_3_title': '手动锁定功能',
                'key_security_3_desc': '：用户可以主动清除 Session',
                'key_security_4': '<strong>错误处理机制</strong>',
                'key_security_4_title': '错误处理机制',
                'key_security_4_desc': '：密码错误会清除 Session，防止暴力破解',
                'source_code_title': '开源代码仓库',
                'source_code_desc': '本工具完全开源，所有代码均可在 GitHub 上查看，确保透明度和安全性。',
                'frontend_files': '前端核心文件',
                'backend_files': '后端核心文件',
                'crypto_utils': 'crypto-utils.js',
                'crypto_utils_desc': '加密工具模块：包含 Shamir\'s Secret Sharing、AES 加密、SecureStorage',
                'index_js': 'index.js',
                'index_js_desc': '主应用逻辑：包含用户界面、账户管理、合约交互等',
                'api_js': 'api.js',
                'api_js_desc': 'API 客户端：封装所有后端 API 调用',
                'config_bp': 'config_bp.py',
                'config_bp_desc': '配置管理路由：包含账户、RPC、ABI 的增删改查',
                'app_py': 'app.py',
                'app_py_desc': 'Flask 应用主文件：包含所有路由和应用配置',
                'models_py': 'models.py',
                'models_py_desc': '数据库模型：包含 User、Account、RpcConfig 等',
                'core_security_features': '核心安全特性',
                'feature_end_to_end': '端到端加密',
                'feature_end_to_end_desc': '所有敏感数据在浏览器端加密，密钥永不离开您的设备',
                'feature_sharding': '私钥分片',
                'feature_sharding_desc': '采用 Shamir\'s Secret Sharing 技术，私钥被分割存储',
                'feature_open_source': '完全开源',
                'feature_open_source_desc': '所有代码公开透明，可自行审计，无后门风险',
                'feature_auto_lock': '自动锁定',
                'feature_auto_lock_desc': 'Session 30 分钟自动过期，主动锁定保护隐私',
                'faq_title': '常见问题',
                'faq_q1': 'Q: 我的私钥会发送到服务器吗？',
                'faq_a1': 'A: 不会。您的私钥永远不会发送到服务器，所有加密操作都在浏览器端完成。',
                'faq_q2': 'Q: 服务器可以还原我的私钥吗？',
                'faq_a2': 'A: 不可以。服务器只存储加密后的分片，且缺少浏览器端的加密密钥，无法还原原始私钥。',
                'faq_q3': 'Q: 我的密码会存储在服务器吗？',
                'faq_a3': 'A: 不会。密码仅用于在浏览器端派生加密密钥，不会以任何形式存储或传输到服务器。',
                'faq_q4': 'Q: 如果我忘记密码怎么办？',
                'faq_a4': 'A: 非常抱歉，由于我们采用端到端加密，密码无法被找回。建议您妥善保管密码，并考虑使用密码管理器。',
                'faq_q5': 'Q: 可以证明代码没有后门吗？',
                'faq_a5': 'A: 本工具完全开源，所有代码均可在 GitHub 上查看。您可以自行审查代码，或使用编译后的版本。我们承诺永远不会在代码中添加任何后门或隐藏功能。',

                // Docs page
                'dev_docs': '开发文档',
                'api_overview': 'API 概述',
                'api_overview_desc': 'EVM API 控制面板提供了一系列 RESTful API，用于管理账户、RPC 节点、ABI 文件，以及与智能合约进行交互。所有 API 都需要通过 X-API-Token 进行认证。',
                'api_features': 'API 特性：',
                'api_feature_1': 'RESTful 设计风格',
                'api_feature_2': '统一的错误处理和响应格式',
                'api_feature_3': '支持多链节点切换',
                'api_feature_4': '完整的智能合约交互功能',
                'api_feature_5': '支持 MetaMask 集成',
                'authentication': '认证方式',
                'auth_desc': '所有 API 接口都需要通过 X-API-Token 进行认证。登录后，系统会返回一个 Token，您需要在每次请求时将该 Token 放在请求头中。',
                'auth_header': '认证请求头：',
                'auth_example': '使用示例：',
                'account_api': '账户管理 API',
                'get_accounts_desc': '获取当前用户的账户列表',
                'add_account_desc': '添加新的账户',
                'delete_account_desc': '删除指定的账户',
                'response_format': '响应格式：',
                'request_body': '请求体：',
                'path_params': '路径参数：',
                'rpc_api': 'RPC 管理 API',
                'get_rpcs_desc': '获取当前用户的 RPC 节点列表',
                'add_rpc_desc': '添加新的 RPC 节点',
                'delete_rpc_desc': '删除指定的 RPC 节点',
                'query_params': '查询参数：',
                'abi_api': 'ABI 管理 API',
                'upload_abi_desc': '上传新的 ABI 文件',
                'delete_abi_desc': '删除指定的 ABI 文件',
                'list_abis_desc': '列出所有可用的 ABI 文件',
                'get_abi_details_desc': '获取 ABI 的详细信息，包括函数、事件、错误等分类',
                'contract_api': '合约交互 API',
                'read_contract_desc': '读取合约数据（Read-only）',
                'write_contract_desc': '写入合约数据（需要签名）',
                'event_api': '事件查询 API',
                'get_events_desc': '查询合约事件日志',
                'transaction_api': '交易相关 API',
                'get_transaction_desc': '获取交易详情',
                'decode_transaction_desc': '解码交易数据',
                'history_api': '历史记录 API',
                'get_call_history_desc': '获取调用历史记录',
                'clear_history_desc': '清空历史记录',
                'config_api': '配置管理 API',
                'get_configs_desc': '获取配置列表',
                'update_config_desc': '更新配置',
                'delete_config_desc': '删除配置'
            },
            'en': {
                'nav_title': 'EVM API Dashboard',
                'config_center': 'Configuration',
                'account_alias': 'Account Alias',
                'rpc_alias': 'Chain/RPC Alias',
                'btn_add_config': 'Add Config',
                'abi_mgmt': 'ABI Management',
                'btn_upload_abi': 'Upload ABI',

                'tab_interact': 'Interaction',
                'tab_tools': 'Tools',
                'tab_events': 'Events',
                'contract_addr': 'Contract Address',
                'chain_rpc': 'Chain/RPC',
                'btn_load_methods': 'Load Methods',
                'method_list': 'Methods:',
                'send_options': 'Send Options (Write Only):',
                'btn_execute': 'Execute',
                'exec_result': 'Result:',
                'waiting': 'Waiting...',
                'tool_receipt': 'Get Receipt',
                'tx_hash': 'Transaction Hash',
                'btn_query_receipt': 'Query Receipt',
                'result_here': 'Result will appear here...',
                'tool_decode': 'Decode Data',
                'encoded_data': 'Encoded Data (Input Data)',
                'related_abi': 'Related ABI',
                'btn_decode': 'Decode',
                'event_name': 'Event Name',
                'from_block': 'From Block',
                'to_block': 'To Block',
                'param_filter': 'Filter (JSON)',
                'btn_query_events': 'Query Events',
                'account_config': 'Account Config',
                'rpc_config': 'RPC Nodes',
                'abi_config': 'ABI Management',
                'connect_metamask': 'Connect MetaMask',
                'upload_abi': 'Upload ABI',
                'add_account': 'Add Account',
                'add_rpc': 'Add RPC',
                'history_title': 'Call History',
                'btn_refresh_history': 'Refresh',
                'btn_clear_history': 'Clear',
                'time': 'Time',
                'type': 'Type',
                'method': 'Method/Contract',
                'params': 'Params',
                'result': 'Result/Error',
                'actions': 'Actions',
                'btn_recall': 'Recall',
                'pill_acc': 'Account',
                'pill_rpc': 'RPC',
                'alias': 'Alias',
                'pk': 'Private Key',
                'addr': 'Address',
                'btn_save_acc': 'Save Account',
                'chain_id': 'Chain ID',
                'btn_save_rpc': 'Save RPC',
                'abi_name': 'ABI Name',
                'abi_content': 'ABI Content',
                'btn_upload': 'Upload',
                'lang_btn': '中文',
                'no_account_msg': 'No accounts configured.',
                'add_acc_prompt': 'Click "Add Config" to add your first wallet account.',
                'btn_connect_mm': 'Connect MetaMask',
                'btn_disconnect_mm': 'Disconnect MetaMask',
                'mm_disconnected': 'MetaMask Not Connected',
                'mm_connected': 'MetaMask Connected',
                'connect_metamask': 'Connect MetaMask',

                // Security page
                'security_title': 'Security Mechanisms & Open Source - EVM API Dashboard',
                'security_desc': 'EVM API Dashboard security mechanisms and open source code display',
                'security_keywords': 'Security mechanisms, open source, private key encryption, Shamir\'s Secret Sharing, EVM API',
                'back_home': 'Back Home',
                'usage_guide': 'Usage Guide',
                'toc_title': 'Table of Contents',
                'overview': 'Security Overview',
                'shamir': 'Shamir\'s Secret Sharing',
                'encryption': 'AES-256-GCM Encryption',
                'secure_storage': 'SecureStorage Module',
                'source_code': 'Open Source Code',
                'security_features': 'Core Security Features',
                'faq': 'FAQ',
                'security_overview': 'Security Overview',
                'security_overview_desc': 'This tool places great importance on user asset security, adopting industry-leading encryption and sharding storage solutions to ensure your private keys are never exposed in plaintext.',
                'end_to_end': 'End-to-End Encryption',
                'fully_open': 'Fully Open Source',
                'key_sharding': 'Key Sharding',
                'why_secure_title': 'Why is entering private keys secure?',
                'security_point_1_title': '1. Private keys never leave your browser',
                'security_point_1_desc': 'All encryption operations are completed locally in your browser, and private keys are never sent to the server in plaintext.',
                'security_point_2_title': '2. Shamir\'s Secret Sharing sharding technology',
                'security_point_2_desc': 'Private keys are split into multiple fragments, stored separately in browser local storage and server. Even if attackers obtain data from both ends simultaneously, they cannot reconstruct the original private key.',
                'security_point_3_title': '3. AES-256-GCM strong encryption',
                'security_point_3_desc': 'Browser-side uses AES-256-GCM algorithm to encrypt private key fragments, with keys derived from your password via PBKDF2, providing extremely high strength.',
                'security_point_4_title': '4. Server cannot reconstruct private keys',
                'security_point_4_desc': 'The server only stores encrypted fragments and lacks the browser-side encryption key, thus cannot reconstruct the original private key.',
                'shamir_title': 'Shamir\'s Secret Sharing Sharding Algorithm',
                'shamir_desc': 'Shamir\'s Secret Sharing is a cryptographic algorithm that can split a secret (such as a private key) into multiple fragments, where only a certain number of fragments are required to reconstruct the original secret.',
                'how_it_works': 'How it works:',
                'shamir_point_1': 'Split the private key into <strong>N</strong> fragments',
                'shamir_point_2': 'Set threshold <strong>K</strong> (K ≤ N)',
                'shamir_point_3': 'At least <strong>K</strong> fragments are required to reconstruct the private key',
                'shamir_point_4': 'Less than <strong>K</strong> fragments cannot obtain any information',
                'storage_strategy': 'Sharding Storage Strategy:',
                'browser_side': 'Browser Side',
                'server_side': 'Server Side',
                'storage_content': 'Storage Content:',
                'browser_storage_content': 'Encrypted private key fragments',
                'server_storage_content': 'Unencrypted private key fragments',
                'encrypt_key': 'Encryption Key:',
                'browser_encrypt_key': 'Derived from your password (PBKDF2)',
                'server_encrypt_key': 'None',
                'key': 'Key:',
                'security': 'Security:',
                'browser_security': 'Only you know the password, the key cannot be cracked',
                'server_security': 'Individual fragments cannot reconstruct the private key',
                'practical_example': 'Practical Application Example:',
                'encryption_title': 'AES-256-GCM Encryption Algorithm',
                'encryption_desc': 'AES-256-GCM is an advanced symmetric encryption algorithm that provides confidentiality, integrity, and authentication.',
                'key_256': '256-bit Key',
                'key_256_desc': '2^256 possibilities, brute force would take longer than the age of the universe',
                'gcm_mode': 'GCM Mode',
                'gcm_mode_desc': 'Provides authenticated encryption, preventing ciphertext tampering',
                'random_iv': 'Random IV',
                'random_iv_desc': 'Uses different initialization vector for each encryption',
                'key_derivation': 'Key Derivation (PBKDF2):',
                'key_derivation_desc': 'Your login password is used to derive the AES encryption key via PBKDF2 algorithm, with the following security features:',
                'iterations_600k': '600,000 iterations',
                'iterations_600k_desc': ': Increases brute force attack cost',
                'salt_value': 'Salt Value',
                'salt_value_desc': ': Prevents rainbow table attacks',
                'sha256_hash': 'SHA-256 Hash',
                'sha256_hash_desc': ': Ensures key strength',
                'secure_storage_title': 'SecureStorage Module Source Code',
                'secure_storage_desc': 'The following is the core SecureStorage code extracted from <code>crypto-utils.js</code>, demonstrating the encrypted storage process of private keys:',
                'encrypt_storage': '1. Private Key Encrypted Storage (saveEncryptedSlice)',
                'decrypt_storage': '2. Private Key Decrypted Read (getDecryptedSlice)',
                'session_cache': '3. Session Cache Mechanism',
                'key_security_features': 'Key Security Features:',
                'key_security_1': '<strong>Password never stored</strong>',
                'key_security_1_title': 'Password never stored',
                'key_security_1_desc': ': Password is only used to derive keys, not saved anywhere',
                'key_security_2': '<strong>Session auto-expiration</strong>',
                'key_security_2_title': 'Session auto-expiration',
                'key_security_2_desc': ': Requires re-entering password after 30 minutes',
                'key_security_3': '<strong>Manual lock function</strong>',
                'key_security_3_title': 'Manual lock function',
                'key_security_3_desc': ': Users can actively clear Session',
                'key_security_4': '<strong>Error handling mechanism</strong>',
                'key_security_4_title': 'Error handling mechanism',
                'key_security_4_desc': ': Password errors clear Session to prevent brute force attacks',
                'source_code_title': 'Open Source Repository',
                'source_code_desc': 'This tool is fully open source, with all code available on GitHub for transparency and security.',
                'frontend_files': 'Frontend Core Files',
                'backend_files': 'Backend Core Files',
                'crypto_utils': 'crypto-utils.js',
                'crypto_utils_desc': 'Encryption utility module: Contains Shamir\'s Secret Sharing, AES encryption, SecureStorage',
                'index_js': 'index.js',
                'index_js_desc': 'Main application logic: Contains user interface, account management, contract interaction, etc.',
                'api_js': 'api.js',
                'api_js_desc': 'API client: Encapsulates all backend API calls',
                'config_bp': 'config_bp.py',
                'config_bp_desc': 'Configuration management routes: Includes CRUD for accounts, RPC, ABI',
                'app_py': 'app.py',
                'app_py_desc': 'Flask application main file: Contains all routes and application configuration',
                'models_py': 'models.py',
                'models_py_desc': 'Database models: Contains User, Account, RpcConfig, etc.',
                'core_security_features': 'Core Security Features',
                'feature_end_to_end': 'End-to-End Encryption',
                'feature_end_to_end_desc': 'All sensitive data is encrypted on the browser side, keys never leave your device',
                'feature_sharding': 'Private Key Sharding',
                'feature_sharding_desc': 'Uses Shamir\'s Secret Sharing technology, private keys are sharded and stored',
                'feature_open_source': 'Fully Open Source',
                'feature_open_source_desc': 'All code is open and transparent, can be audited, no backdoor risk',
                'feature_auto_lock': 'Auto Lock',
                'feature_auto_lock_desc': 'Session auto-expires after 30 minutes, manual lock protects privacy',
                'faq_title': 'Frequently Asked Questions',
                'faq_q1': 'Q: Will my private key be sent to the server?',
                'faq_a1': 'A: No. Your private key is never sent to the server, all encryption operations are completed on the browser side.',
                'faq_q2': 'Q: Can the server reconstruct my private key?',
                'faq_a2': 'A: No. The server only stores encrypted fragments and lacks the browser-side encryption key, cannot reconstruct the original private key.',
                'faq_q3': 'Q: Will my password be stored on the server?',
                'faq_a3': 'A: No. Password is only used to derive encryption keys on the browser side, never stored or transmitted to the server in any form.',
                'faq_q4': 'Q: What if I forget my password?',
                'faq_a4': 'A: Sorry, due to end-to-end encryption, passwords cannot be recovered. Please keep your password safe and consider using a password manager.',
                'faq_q5': 'Q: Can you prove there are no backdoors in the code?',
                'faq_a5': 'A: This tool is fully open source, all code is available on GitHub. You can audit the code yourself or use the compiled version. We promise to never add any backdoors or hidden features to the code.',
                'dev_docs': 'Development Documentation',
                'api_overview': 'API Overview',
                'api_overview_desc': 'EVM API Dashboard provides a series of RESTful APIs for managing accounts, RPC nodes, ABI files, and interacting with smart contracts. All APIs require authentication via X-API-Token.',
                'api_features': 'API Features:',
                'api_feature_1': 'RESTful design style',
                'api_feature_2': 'Unified error handling and response format',
                'api_feature_3': 'Supports multi-chain node switching',
                'api_feature_4': 'Complete smart contract interaction functionality',
                'api_feature_5': 'Supports MetaMask integration',
                'authentication': 'Authentication Method',
                'auth_desc': 'All API endpoints require authentication via X-API-Token. After login, the system returns a Token that you need to include in the request header for each request.',
                'auth_header': 'Authentication Request Header:',
                'auth_example': 'Usage Example:',
                'account_api': 'Account Management API',
                'get_accounts_desc': 'Get current user\'s account list',
                'add_account_desc': 'Add new account',
                'delete_account_desc': 'Delete specified account',
                'response_format': 'Response Format:',
                'request_body': 'Request Body:',
                'path_params': 'Path Parameters:',
                'rpc_api': 'RPC Management API',
                'get_rpcs_desc': 'Get current user\'s RPC node list',
                'add_rpc_desc': 'Add new RPC node',
                'delete_rpc_desc': 'Delete specified RPC node',
                'query_params': 'Query Parameters:',
                'abi_api': 'ABI Management API',
                'upload_abi_desc': 'Upload new ABI file',
                'delete_abi_desc': 'Delete specified ABI file',
                'list_abis_desc': 'List all available ABI files',
                'get_abi_details_desc': 'Get ABI details including functions, events, errors categorization',
                'contract_api': 'Contract Interaction API',
                'read_contract_desc': 'Read contract data (Read-only)',
                'write_contract_desc': 'Write contract data (requires signature)',
                'event_api': 'Event Query API',
                'get_events_desc': 'Query contract event logs',
                'transaction_api': 'Transaction Related API',
                'get_transaction_desc': 'Get transaction details',
                'decode_transaction_desc': 'Decode transaction data',
                'history_api': 'History API',
                'get_call_history_desc': 'Get call history',
                'clear_history_desc': 'Clear history',
                'config_api': 'Configuration Management API',
                'get_configs_desc': 'Get configuration list',
                'update_config_desc': 'Update configuration',
                'delete_config_desc': 'Delete configuration'
            }
        };

        // ==========================================
        // 2. 全局工具函数
        // ==========================================
        
        // 递归获取规范化类型（将 tuple 转换为 (type1,type2...)）
        function getCanonicalType(input) {
            if (input.type.startsWith('tuple') && input.components) {
                const isArray = input.type.endsWith('[]');
                // 递归处理组件
                const components = input.components.map(getCanonicalType).join(',');
                const base = `(${components})`;
                return isArray ? `${base}[]` : base;
            }
            return input.type;
        }

        function updateUI() {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (translations[currentLang][key]) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = translations[currentLang][key];
                    } else {
                        el.innerText = translations[currentLang][key];
                    }
                }
            });
            document.getElementById('lang-btn').innerText = translations[currentLang]['lang_btn'];
        }

        function toggleLanguage() {
            currentLang = currentLang === 'zh' ? 'en' : 'zh';
            localStorage.setItem('lang', currentLang);
            updateUI();
        }

        function showToast(msg, type = 'info') {
            const toastEl = document.getElementById('liveToast');
            const toastBody = document.getElementById('toast-message');
            const toastHeader = toastEl.querySelector('.toast-header');
            
            toastBody.innerText = msg;
            
            // 根据类型更新样式
            toastHeader.className = 'toast-header text-white ' + 
                (type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-primary');
            
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
        }

        async function checkAuth() {
            const token = localStorage.getItem('evm_api_token');
            
            // 获取导航栏元素
            const userDisplay = document.getElementById('user-display');
            const logoutBtn = document.getElementById('logout-btn');
            const langBtn = document.getElementById('lang-btn');
            
            // 动态创建或获取“登录按钮”
            let loginBtn = document.getElementById('guest-login-btn');
            if (!loginBtn) {
                loginBtn = document.createElement('button');
                loginBtn.id = 'guest-login-btn';
                loginBtn.className = 'btn btn-sm btn-primary me-2';
                loginBtn.innerText = '登录 / 注册';
                loginBtn.onclick = () => authModal.show();
                // 插入到语言按钮前面
                langBtn.parentNode.insertBefore(loginBtn, langBtn);
            }

            // 情况 A：完全没有 Token
            if (!token) {
                showGuestUI(userDisplay, logoutBtn, loginBtn);
                document.body.style.display = 'block'; // 确保页面可见
                return;
            }

            // 情况 B：有 Token，尝试验证
            try {
                const res = await fetch('/api/user_info');
                if (res.ok) {
                    const data = await res.json();
                    currentUser = data.data.username;
                    
                    // 显示用户 UI
                    showUserUI(data.data.username, userDisplay, logoutBtn, loginBtn);
                    
                    // 登录成功，去加载私有数据
                    initApp(); 
                } else {
                    // Token 已失效
                    localStorage.removeItem('evm_api_token');
                    showGuestUI(userDisplay, logoutBtn, loginBtn);
                }
            } catch (err) {
                console.error("Auth check error:", err);
                showGuestUI(userDisplay, logoutBtn, loginBtn);
            }
            
            document.body.style.display = 'block'; 
        }

        // 辅助函数：切换到游客界面
        function showGuestUI(display, logout, login) {
            if (display) display.style.display = 'none';
            if (logout) logout.style.display = 'none';
            if (login) login.style.display = 'inline-block';
            // 隐藏 Token 显示（如果有）
            const tokenW = document.getElementById('user-token-display-wrapper');
            if (tokenW) tokenW.style.display = 'none';
        }

        // 辅助函数：切换到用户界面
        function showUserUI(username, display, logout, login) {
            if (display) {
                display.innerText = `用户: ${username}`;
                display.style.display = 'inline';
            }
            if (logout) logout.style.display = 'inline';
            if (login) login.style.display = 'none';
        }

        function updateAuthState() {
            if (currentUser) {
                document.getElementById('user-display').innerText = `用户: ${currentUser}`;
                document.getElementById('user-display').style.display = 'inline';
                document.getElementById('logout-btn').style.display = 'inline';
                authModal.hide();
                document.body.style.display = 'block';
            } else {
                document.getElementById('user-display').style.display = 'none';
                document.getElementById('logout-btn').style.display = 'none';
                authModal.show();
            }
        }

        async function logout() {
            localStorage.removeItem('evm_api_token');
            window.location.reload();
        }

        // 锁定 Session（清除内存中的密钥缓存）
        function lockSession() {
            if (typeof SecureStorage !== 'undefined') {
                SecureStorage.clearSession();
                updateSessionStatus();
                showToast('Session 已锁定，下次操作需重新输入密码', 'info');
            }
        }

        // 更新 Session 状态显示
        function updateSessionStatus() {
            const sessionStatusEl = document.getElementById('session-status');
            const sessionStatusText = document.getElementById('session-status-text');
            
            if (!sessionStatusEl || !sessionStatusText) return;
            
            const selectedAccount = document.getElementById('select-account')?.value;
            
            if (selectedAccount && typeof SecureStorage !== 'undefined' && SecureStorage.isSessionValid(selectedAccount)) {
                const expiryTime = SecureStorage.getSessionExpiryTime(selectedAccount);
                const remaining = Math.round((expiryTime - Date.now()) / 60000); // 剩余分钟数
                
                sessionStatusEl.style.display = 'flex';
                sessionStatusText.className = 'text-success small';
                sessionStatusText.innerHTML = `<i class="bi bi-shield-lock"></i> 已解锁 (${remaining}分钟)`;
                sessionStatusText.title = `Session 有效期至：${new Date(expiryTime).toLocaleTimeString()}`;
            } else {
                sessionStatusEl.style.display = 'none';
            }
        }

        document.getElementById('toggle-auth-mode').onclick = (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            document.getElementById('authModalTitle').innerText = isLoginMode ? '登录' : '注册';
            document.getElementById('auth-submit-btn').innerText = isLoginMode ? '登录' : '注册';
            document.getElementById('toggle-auth-mode').innerText = isLoginMode ? '没有账号？立即注册' : '已有账号？返回登录';
            document.getElementById('auth-error').style.display = 'none';
        };

        document.getElementById('auth-form').onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('auth-username').value;
            const password = document.getElementById('auth-password').value;
            const url = isLoginMode ? '/login' : '/register';
            
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (res.ok) {
                    if (isLoginMode) {
                        // 登录成功，保存 Token
                        if (data.data.token) {
                            localStorage.setItem('evm_api_token', data.data.token);
                        }
                        currentUser = data.data.username;
                        updateAuthState();
                        checkAuth(); // 重新触发认证检查以更新 UI
                    } else {
                        alert('注册成功，请登录');
                        isLoginMode = true;
                        document.getElementById('authModalTitle').innerText = '登录';
                        document.getElementById('auth-submit-btn').innerText = '登录';
                        document.getElementById('toggle-auth-mode').innerText = '没有账号？立即注册';
                    }
                } else {
                    const errEl = document.getElementById('auth-error');
                    errEl.innerText = data.message || '操作失败';
                    errEl.style.display = 'block';
                }
            } catch (err) {
                console.error(err);
            }
        };

        function initApp() {
            updateUI();
            refreshAbiList();
            refreshConfigs();
            refreshHistory(); // 初始化时刷新历史记录
            setupAuthChecks();
            setupMetamask();
        }

        function setupMetamask() {
            // 监听MetaMask事件
            if (typeof window.ethereum !== 'undefined') {
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);
                window.ethereum.on('disconnect', handleDisconnect);
            }
            
            // 初始化按钮状态
            updateMetamaskStatus();
            
            // 页面加载时自动检查MetaMask连接状态
            checkMetamaskConnection();
        }

        async function checkMetamaskConnection() {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    // 检查是否已连接
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        metamaskAccount = accounts[0];
                        
                        // 创建提供者和签名者 (ethers v6)
                        metamaskProvider = new ethers.BrowserProvider(window.ethereum);
                        metamaskSigner = await metamaskProvider.getSigner();
                        
                        // 获取网络信息
                        const network = await metamaskProvider.getNetwork();
                        metamaskChainId = Number(network.chainId);
                        
                        // 更新状态
                        updateMetamaskStatus();
                        refreshConfigs();
                    }
                } catch (error) {
                    console.log('MetaMask 未连接:', error);
                }
            }
        }

        async function connectMetamask() {
            if (typeof ethers === 'undefined') {
                showToast('Ethers.js 库加载失败，请刷新页面', 'danger');
                return;
            }
            
            if (typeof window.ethereum === 'undefined') {
                showToast('未检测到 MetaMask 钱包', 'danger');
                return;
            }
            
            try {
                // 请求账户访问
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                metamaskAccount = accounts[0];
                
                // 创建提供者和签名者 (ethers v6)
                metamaskProvider = new ethers.BrowserProvider(window.ethereum);
                metamaskSigner = await metamaskProvider.getSigner();
                
                // 获取网络信息
                const network = await metamaskProvider.getNetwork();
                metamaskChainId = Number(network.chainId);
                
                // 更新状态
                updateMetamaskStatus();
                refreshConfigs();
                showToast('MetaMask 连接成功', 'success');
            } catch (error) {
                console.error('MetaMask 连接失败:', error);
                showToast('MetaMask 连接失败: ' + error.message, 'danger');
            }
        }

        function disconnectMetamask() {
            // 重置MetaMask状态
            metamaskProvider = null;
            metamaskSigner = null;
            metamaskAccount = null;
            metamaskChainId = null;
            
            // 更新UI
            updateMetamaskStatus();
            refreshConfigs();
            showToast('MetaMask 已断开连接', 'info');
        }

        function updateMetamaskStatus() {
            // 导航栏元素
            const navStatusEl = document.getElementById('metamask-nav-status');
            const navAccountEl = document.getElementById('metamask-nav-account');
            const navConnectBtn = document.getElementById('nav-connect-metamask-btn');
            
            console.log('updateMetamaskStatus - metamaskAccount:', metamaskAccount);
            
            if (metamaskAccount) {
                // 更新导航栏状态
                if (navAccountEl && metamaskAccount) {
                    const safeText = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(`MetaMask: ${metamaskAccount.substring(0, 6)}...`) : `MetaMask: ${metamaskAccount.substring(0, 6)}...`;
                    navAccountEl.innerHTML = safeText;
                }
                if (navStatusEl) navStatusEl.style.display = 'flex';
                if (navConnectBtn) navConnectBtn.style.display = 'none';
                

            } else {
                // 更新导航栏状态
                if (navStatusEl) navStatusEl.style.display = 'none';
                if (navConnectBtn) navConnectBtn.style.display = 'block';

            }
        }

        function handleAccountsChanged(accounts) {
            if (accounts.length === 0) {
                // 账户已锁定或断开
                disconnectMetamask();
            } else if (accounts[0] !== metamaskAccount) {
                // 账户已更改
                metamaskAccount = accounts[0];
                updateMetamaskStatus();
                showToast('MetaMask 账户已更改', 'info');
            }
        }

        function handleChainChanged(chainId) {
            metamaskChainId = parseInt(chainId, 16);
            updateMetamaskStatus();
            refreshConfigs();
            showToast('MetaMask 网络已更改', 'info');
        }

        function handleDisconnect() {
            disconnectMetamask();
            showToast('MetaMask 已断开连接', 'info');
        }

        function checkLogin() {
            const token = localStorage.getItem('evm_api_token');
            if (!token) {
                authModal.show();
                return false;
            }
            return true;
        }

        function setupAuthChecks() {
            // 为所有操作按钮添加登录检查
            const buttons = [
                'btn-load-methods',
                'btn-execute',
                'btn-get-receipt',
                'btn-decode-tx',
                'btn-get-events',
                'btn_upload_abi'
            ];

            buttons.forEach(id => {
                const button = document.getElementById(id);
                if (button) {
                    const originalOnClick = button.onclick;
                    button.onclick = function(event) {
                        if (!checkLogin()) {
                            return;
                        }
                        if (originalOnClick) {
                            originalOnClick(event);
                        }
                    };
                }
            });

            // 为配置按钮添加登录检查
            const configButtons = document.querySelectorAll('[data-bs-target="#configModal"]');
            configButtons.forEach(button => {
                const originalOnClick = button.onclick;
                button.onclick = function(event) {
                    if (!checkLogin()) {
                        return;
                    }
                    if (originalOnClick) {
                        originalOnClick(event);
                    }
                };
            });

            // 为历史记录操作添加登录检查
            document.getElementById('history-list').addEventListener('click', function(event) {
                if (event.target.closest('button')) {
                    if (!checkLogin()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            });

            // 为上传ABI按钮添加登录检查
            const uploadAbiBtn = document.querySelector('[onclick="uploadAbi()"]');
            if (uploadAbiBtn) {
                uploadAbiBtn.onclick = function() {
                    if (!checkLogin()) {
                        return;
                    }
                    uploadAbi();
                };
            }

            // 为打开上传ABI模态框的按钮添加登录检查
            const uploadAbiModalBtn = document.querySelector('[data-bs-target="#uploadAbiModal"]');
            if (uploadAbiModalBtn) {
                uploadAbiModalBtn.onclick = function(event) {
                    if (!checkLogin()) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                };
            }
        }

        async function uploadAbi() {
            // 检查登录状态
            if (!checkLogin()) {
                return;
            }
            
            const abiName = document.getElementById('upload-abi-name').value;
            const abiContent = document.getElementById('upload-abi-content').value;
            
            if (!abiName || !abiContent) {
                showToast('请填写ABI名称和内容', 'danger');
                return;
            }
            
            try {
                // 解析ABI内容为JSON对象
                let parsedAbi;
                try {
                    parsedAbi = JSON.parse(abiContent);
                } catch (parseError) {
                    showToast('ABI内容格式错误，请检查JSON格式', 'danger');
                    return;
                }
                
                const res = await fetch('/upload_abi', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ abi_name: abiName, abi_content: parsedAbi })
                });
                
                const data = await res.json();
                if (res.ok) {
                    showToast('ABI上传成功', 'success');
                    refreshAbiList();
                    // 关闭模态框
                    const uploadAbiModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('uploadAbiModal'));
                    uploadAbiModal.hide();
                    // 清空表单
                    document.getElementById('upload-abi-name').value = '';
                    document.getElementById('upload-abi-content').value = '';
                } else {
                    showToast('上传失败: ' + (data.message || '未知错误'), 'danger');
                }
            } catch (error) {
                console.error('上传ABI时出错:', error);
                showToast('上传失败: ' + error.message, 'danger');
            }
        }

        async function saveAccountConfig() {
            // 检查登录状态
            if (!checkLogin()) {
                return;
            }
            
            const alias = document.getElementById('cfg-acc-alias').value;
            const privateKey = document.getElementById('cfg-acc-pk').value;
            const address = document.getElementById('cfg-acc-addr').value;
            
            // 表单验证
            if (!alias) {
                showToast('请填写账户别名', 'danger');
                return;
            }
            if (alias.length > 7) {
                showToast('账户别名长度不能超过7个字符', 'danger');
                return;
            }
            if (!privateKey) {
                showToast('请填写私钥', 'danger');
                return;
            }
            if (!address) {
                showToast('请填写地址', 'danger');
                return;
            }
            
            try {
                // 验证私钥格式
                let cleanPrivateKey = privateKey;
                if (cleanPrivateKey.startsWith('0x')) {
                    cleanPrivateKey = cleanPrivateKey.slice(2);
                }
                if (cleanPrivateKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
                    showToast('私钥格式不正确', 'danger');
                    return;
                }
                
                // 使用 Shamir 算法对私钥进行分片（3 取 2）
                const slices = Shamir.share(cleanPrivateKey, 3, 2);
                
                // 准备存储：服务器存 A 片，本地存 B 片（C 片可用于备份，这里暂不处理）
                const sliceA = slices[0];
                const sliceB = slices[1];
                
                // 发送到服务器（通过 HTTPS 和用户认证保护）
                // 弹出密码输入框，用于加密本地分片
                const password = prompt("请设置交易密码（用于加密本地分片，请妥善保管）：");
                if (!password || password.length < 6) {
                    showToast('交易密码至少 6 位，请重新设置', 'danger');
                    return;
                }
                
                const res = await fetch('/api/accounts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        alias, 
                        address, 
                        pk_slice_server: sliceA 
                    })
                });
                
                const data = await res.json();
                if (res.ok) {
                    // 服务器保存成功后，加密保存本地分片
                    try {
                        await SecureStorage.saveEncryptedSlice(alias, sliceB, password);
                        showToast('账户保存成功（分片已加密存储）', 'success');
                    } catch (encryptError) {
                        console.error('加密分片失败:', encryptError);
                        showToast('加密分片失败：' + encryptError.message, 'danger');
                        return;
                    }
                    refreshConfigs();
                    // 关闭模态框
                    const configModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('configModal'));
                    configModal.hide();
                    // 清空表单
                    document.getElementById('cfg-acc-alias').value = '';
                    document.getElementById('cfg-acc-pk').value = '';
                    document.getElementById('cfg-acc-addr').value = '';
                } else {
                    showToast('保存失败：' + (data.message || '未知错误'), 'danger');
                }
            } catch (error) {
                console.error('保存账户时出错:', error);
                showToast('保存失败：' + error.message, 'danger');
            }
        }

        async function saveRpcConfig() {
            // 检查登录状态
            if (!checkLogin()) {
                return;
            }
            
            const chainId = document.getElementById('cfg-rpc-id').value;
            const alias = document.getElementById('cfg-rpc-alias').value;
            const rpcUrl = document.getElementById('cfg-rpc-url').value;
            
            // 表单验证
            if (!chainId) {
                showToast('请填写链ID', 'danger');
                return;
            }
            if (!alias) {
                showToast('请填写别名', 'danger');
                return;
            }
            if (alias.length > 7) {
                showToast('别名长度不能超过7个字符', 'danger');
                return;
            }
            if (!rpcUrl) {
                showToast('请填写RPC URL', 'danger');
                return;
            }
            
            // 验证链ID格式
            if (isNaN(chainId) || parseInt(chainId) <= 0) {
                showToast('链ID必须是正整数', 'danger');
                return;
            }
            
            // 验证RPC URL格式
            try {
                new URL(rpcUrl);
            } catch {
                showToast('RPC URL格式错误', 'danger');
                return;
            }
            
            try {
                const res = await fetch('/api/rpcs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ chain_id: parseInt(chainId), alias, rpc_url: rpcUrl })
                });
                
                const data = await res.json();
                if (res.ok) {
                    showToast('RPC保存成功', 'success');
                    refreshConfigs();
                    // 关闭模态框
                    const configModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('configModal'));
                    configModal.hide();
                    // 清空表单
                    document.getElementById('cfg-rpc-id').value = '';
                    document.getElementById('cfg-rpc-alias').value = '';
                    document.getElementById('cfg-rpc-url').value = '';
                } else {
                    showToast('保存失败: ' + (data.message || '未知错误'), 'danger');
                }
            } catch (error) {
                console.error('保存RPC时出错:', error);
                showToast('保存失败: ' + error.message, 'danger');
            }
        }

        document.addEventListener('DOMContentLoaded', checkAuth);

        // ==========================================
        // 2. 核心状态与 Web3 逻辑
        // ==========================================
        let currentMethods = [];
        let currentSelectedMethod = null;

        // MetaMask 相关状态
        let metamaskProvider = null;
        let metamaskSigner = null;
        let metamaskAccount = null;
        let metamaskChainId = null;

        let lastHistoryData = []; // 用于存储最近一次获取的历史记录

        function parseInputValue(value, type) {
            if (value === '') {
                if (type.startsWith('uint') || type.startsWith('int')) return "0";
                if (type === 'bool') return false;
                if (type === 'address') return "0x0000000000000000000000000000000000000000";
                return '';
            }
            // 【修复】把数组和结构体的判断放在最上面
            if (type.endsWith('[]') || type.startsWith('tuple')) return JSON.parse(value);
            if (type.startsWith('uint') || type.startsWith('int')) {
                try {
                    // v6: 使用原生 BigInt，确保 JSON 序列化时不会变成对象
                    return BigInt(value).toString();
                } catch (e) {
                    console.error('Invalid number:', value);
                    return value;
                }
            }
            if (type === 'bool') return value.toLowerCase() === 'true';
            return value;
        }



        // 通用功能
        async function refreshAbiList() {
            const res = await fetch('/list_abis');
            const data = await res.json();
            if (data.status === 'success') {
                const list = document.getElementById('abi-list');
                const selects = ['select-abi', 'event-select-abi', 'tool-decode-abi'];
                list.innerHTML = '';
                const safeOption = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize('<option value="">Select...</option>') : '<option value="">Select...</option>';
                selects.forEach(id => document.getElementById(id).innerHTML = safeOption);
                data.data.abis.forEach(abi => {
                    // 使用DOM操作而非innerHTML，彻底防止XSS攻击
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    
                    const span = document.createElement('span');
                    span.textContent = abi; // 使用textContent避免HTML注入
                    li.appendChild(span);
                    
                    const button = document.createElement('button');
                    button.className = 'btn btn-sm text-danger';
                    button.dataset.abiName = abi; // 直接设置数据属性，避免字符串拼接
                    button.textContent = '×';
                    button.onclick = function() { deleteAbi(this.dataset.abiName); };
                    li.appendChild(button);
                    
                    list.appendChild(li);
                    
                    selects.forEach(id => {
                        const option = document.createElement('option');
                        option.value = abi;
                        option.textContent = abi;
                        document.getElementById(id).appendChild(option);
                    });
                });
            }
        }

        // 转义HTML特殊字符，防止XSS攻击
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // 转义HTML属性值，确保引号不会破坏属性结构
        function escapeHtmlAttribute(value) {
            return value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        async function refreshConfigs() {
            const res = await fetch(`/get_configs?t=${new Date().getTime()}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await res.json();
            const rpcSelects = ['select-chain', 'tool-chain-select', 'event-select-chain'];
            const accSelect = document.getElementById('select-account');
            
            const safeOption = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize('<option value="">Select...</option>') : '<option value="">Select...</option>';
            rpcSelects.forEach(id => document.getElementById(id).innerHTML = safeOption);
            accSelect.innerHTML = safeOption;
            document.getElementById('account-list').innerHTML = '';
            document.getElementById('rpc-list').innerHTML = '';
            
            // 监听账户选择变化，更新 Session 状态
            accSelect.onchange = function() {
                updateSessionStatus();
            };

            // 添加MetaMask账户和网络
            if (metamaskAccount) {
                const escapedMetamaskChainId = escapeHtmlAttribute(String(metamaskChainId));
                const escapedMetamaskAccount = escapeHtmlAttribute(metamaskAccount);
                const mOpt = `<option value="${escapedMetamaskChainId}">MetaMask (${escapeHtml(metamaskChainId)})</option>`;
                rpcSelects.forEach(id => document.getElementById(id).innerHTML += mOpt);
                accSelect.innerHTML += `<option value="${escapedMetamaskAccount}">MetaMask</option>`;
            }

            if (data.status === 'success') {
                if (data.data.accounts.length === 0) {
                    const safeHtml = typeof DOMPurify !== 'undefined' 
                        ? DOMPurify.sanitize(`
                            <div class="p-2 text-center border rounded bg-light">
                                <p class="mb-1 small text-muted" data-i18n="no_account_msg">${translations[currentLang]['no_account_msg']}</p>
                                <p class="mb-0 x-small text-secondary" data-i18n="add_acc_prompt" style="font-size: 0.75rem;">${translations[currentLang]['add_acc_prompt']}</p>
                            </div>
                        `)
                        : `
                            <div class="p-2 text-center border rounded bg-light">
                                <p class="mb-1 small text-muted" data-i18n="no_account_msg">${translations[currentLang]['no_account_msg']}</p>
                                <p class="mb-0 x-small text-secondary" data-i18n="add_acc_prompt" style="font-size: 0.75rem;">${translations[currentLang]['add_acc_prompt']}</p>
                            </div>
                        `;
                    document.getElementById('account-list').innerHTML = safeHtml;
                } else {
                    data.data.accounts.forEach(acc => {
                        // 添加到下拉框
                        const option = document.createElement('option');
                        option.value = acc;
                        option.textContent = acc;
                        accSelect.appendChild(option);
                        
                        // 创建账户列表项
                        const li = document.createElement('li');
                        li.className = 'list-group-item d-flex justify-content-between align-items-center';
                        
                        const span = document.createElement('span');
                        span.textContent = acc;
                        
                        li.appendChild(span);
                        
                        const button = document.createElement('button');
                        button.className = 'btn btn-sm text-danger';
                        button.dataset.account = acc;
                        button.textContent = '×';
                        button.onclick = function() { deleteAccount(this.dataset.account); };
                        li.appendChild(button);
                        
                        document.getElementById('account-list').appendChild(li);
                    });
                }
                data.data.chains.forEach(c => {
                    const chainId = c.chain_id.toString();
                    const alias = c.alias || '';
                    const displayName = alias && alias !== chainId ? `${alias} (${chainId})` : chainId;
                    
                    // 添加到下拉框
                    rpcSelects.forEach(id => {
                        const option = document.createElement('option');
                        option.value = chainId;
                        option.textContent = displayName;
                        document.getElementById(id).appendChild(option);
                    });
                    
                    // 创建RPC列表项
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    
                    const div = document.createElement('div');
                    div.className = 'd-flex flex-column';
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = alias || chainId;
                    
                    const idSpan = document.createElement('span');
                    idSpan.className = 'x-small text-muted';
                    idSpan.style.fontSize = '0.7rem';
                    idSpan.textContent = `ID: ${chainId}`;
                    
                    div.appendChild(nameSpan);
                    div.appendChild(idSpan);
                    li.appendChild(div);
                    
                    const button = document.createElement('button');
                    button.className = 'btn btn-sm text-danger';
                    button.dataset.chainId = chainId;
                    button.textContent = '×';
                    button.onclick = function() { deleteRpc(this.dataset.chainId); };
                    li.appendChild(button);
                    
                    document.getElementById('rpc-list').appendChild(li);
                });
            }
        }

        async function deleteAbi(n) { if(confirm('Delete?')) { const res = await fetch(`/delete_abi?abi_name=${n}`, {method:'DELETE'}); if(res.ok) { refreshAbiList(); showToast('ABI Deleted', 'success'); } else showToast('Delete failed', 'danger'); } }
        async function deleteAccount(a) { 
            if(confirm('确定删除此账户？这将同时删除本地加密的分片数据！')) { 
                const res = await fetch(`/api/accounts/${a}`, {method:'DELETE'}); 
                if(res.ok) { 
                    // 同时删除本地加密分片
                    if (typeof SecureStorage !== 'undefined') {
                        SecureStorage.removeEncryptedSlice(a);
                    }
                    refreshConfigs(); 
                    showToast('账户已删除（包括本地加密分片）', 'success'); 
                } else { 
                    showToast('删除失败', 'danger'); 
                } 
            } 
        }
        async function deleteRpc(id) { if(confirm('Delete?')) { const res = await fetch(`/api/rpcs/${id}`, {method:'DELETE'}); if(res.ok) { refreshConfigs(); showToast('RPC Deleted', 'success'); } else showToast('Delete failed', 'danger'); } }

        async function clearCallHistory() {
            if(confirm('Clear all history?')) {
                const res = await fetch('/api/history/clear', {method:'POST'});
                if(res.ok) refreshHistory();
            }
        }

        async function refreshHistory() {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (data.status === 'success') {
                lastHistoryData = data.data; // 存储历史数据
                const list = document.getElementById('history-list');
                list.innerHTML = '';
                lastHistoryData.forEach((h, index) => {
                    // 使用 DOM 操作而非字符串拼接，避免样式丢失
                    const row = document.createElement('tr');
                    
                    // 时间列
                    const timeCell = document.createElement('td');
                    const timeSmall = document.createElement('small');
                    timeSmall.textContent = h.timestamp;
                    timeCell.appendChild(timeSmall);
                    row.appendChild(timeCell);
                    
                    // 类型列
                    const typeCell = document.createElement('td');
                    const typeBadge = document.createElement('span');
                    typeBadge.className = `badge ${h.type === 'read' ? 'bg-info' : 'bg-warning'}`;
                    typeBadge.textContent = h.type === 'read' ? 'Read' : 'Write';
                    typeCell.appendChild(typeBadge);
                    row.appendChild(typeCell);
                    
                    // 方法/合约列
                    const methodCell = document.createElement('td');
                    const methodStrong = document.createElement('strong');
                    methodStrong.textContent = h.method;
                    methodCell.appendChild(methodStrong);
                    methodCell.appendChild(document.createElement('br'));
                    const contractSmall = document.createElement('small');
                    contractSmall.className = 'text-muted';
                    contractSmall.textContent = h.contract ? h.contract.substring(0, 10) + '...' : 'N/A';
                    methodCell.appendChild(contractSmall);
                    row.appendChild(methodCell);
                    
                    // 参数列
                    const argsCell = document.createElement('td');
                    const argsText = JSON.stringify(h.args, null, 2);
                    
                    const argsToggle = document.createElement('div');
                    argsToggle.className = 'toggle-btn';
                    argsToggle.textContent = 'Show Args';
                    argsToggle.onclick = function() { toggleFold(`args-${index}`); };
                    argsCell.appendChild(argsToggle);
                    
                    const argsContent = document.createElement('div');
                    argsContent.id = `args-${index}`;
                    argsContent.className = 'collapsible-content';
                    const argsPre = document.createElement('pre');
                    argsPre.className = 'p-2 mb-0';
                    argsPre.style.fontSize = '0.7rem';
                    argsPre.textContent = argsText;
                    argsContent.appendChild(argsPre);
                    argsCell.appendChild(argsContent);
                    row.appendChild(argsCell);
                    
                    // 结果列
                    const resultCell = document.createElement('td');
                    const resultColor = h.error ? 'text-danger' : 'text-success';
                    resultCell.className = resultColor;
                    
                    const resultText = h.error ? h.error : (h.type === 'read' ? JSON.stringify(h.result, null, 2) : `TX Hash: ${h.result.tx_hash}`);
                    
                    const resultToggle = document.createElement('div');
                    resultToggle.className = 'toggle-btn';
                    resultToggle.textContent = 'Show Result';
                    resultToggle.onclick = function() { toggleFold(`res-${index}`); };
                    resultCell.appendChild(resultToggle);
                    
                    const resultContent = document.createElement('div');
                    resultContent.id = `res-${index}`;
                    resultContent.className = 'collapsible-content';
                    const resultPre = document.createElement('pre');
                    resultPre.className = 'p-2 mb-0';
                    resultPre.style.fontSize = '0.7rem';
                    resultPre.style.color = 'inherit';
                    resultPre.textContent = resultText;
                    resultContent.appendChild(resultPre);
                    resultCell.appendChild(resultContent);
                    row.appendChild(resultCell);
                    
                    // 操作列
                    const actionCell = document.createElement('td');
                    const recallBtn = document.createElement('button');
                    recallBtn.className = 'btn btn-sm btn-outline-primary';
                    recallBtn.onclick = function() { recallHistory(index); };
                    
                    const recallIcon = document.createElement('i');
                    recallIcon.className = 'bi bi-arrow-repeat';
                    recallBtn.appendChild(recallIcon);
                    
                    const recallText = document.createElement('span');
                    recallText.setAttribute('data-i18n', 'btn_recall');
                    recallText.textContent = 'Recall';
                    recallBtn.appendChild(recallText);
                    
                    actionCell.appendChild(recallBtn);
                    row.appendChild(actionCell);
                    
                    // 添加到列表
                    list.appendChild(row);
                });
            }
        }
        // 控制历史记录中参数和结果的展开/折叠
        function toggleFold(id) {
            const el = document.getElementById(id);
            if (!el) return;
            
            const btn = el.previousElementSibling; // 获取“Show Args”或“Show Result”那个文字按钮
            
            if (el.classList.contains('show')) {
                el.classList.remove('show');
                // 将“Hide”替换回“Show”
                if (btn) btn.innerText = btn.innerText.replace('Hide', 'Show');
            } else {
                el.classList.add('show');
                // 将“Show”替换为“Hide”
                if (btn) btn.innerText = btn.innerText.replace('Show', 'Hide');
            }
        }
                // ==========================================
        // ==========================================
        // 1. 统一的方法加载函数 (支持 await)
        // ==========================================
        async function performLoadMethods(abiName) {
            if (!abiName) return false;
            
            // 自动同步下拉框显示
            const selectAbi = document.getElementById('select-abi');
            if (selectAbi) selectAbi.value = abiName;

            try {
                const res = await fetch(`/get_abi_details?abi_name=${abiName}`);
                const data = await res.json();
                if (data.status === 'success') {
                    currentMethods = data.data.details.functions;
                    const list = document.getElementById('methods-list'); 
                    list.innerHTML = '';
                    
                    currentMethods.forEach((m) => {
                        const isRead = m.stateMutability === 'view' || m.stateMutability === 'pure';
                        const badge = `<span class="badge ${isRead ? 'bg-info' : 'bg-warning'} ms-2">${isRead ? 'R' : 'W'}</span>`;
                        const item = document.createElement('a');
                        item.className = 'list-group-item list-group-item-action method-item';
                        item.id = `method-link-${m.name}`; // 给个 ID 方便 Recall 定位
                        const safeHtml = typeof DOMPurify !== 'undefined' 
                            ? DOMPurify.sanitize(`<span>${m.name}</span>${badge}`)
                            : `<span>${m.name}</span>${badge}`;
                        item.innerHTML = safeHtml;
                        item.onclick = () => renderMethodUI(m);
                        list.appendChild(item);
                    });
                    document.getElementById('methods-container').style.display = 'flex';
                    return true; // 返回成功标记
                }
            } catch (err) {
                console.error("加载方法列表失败:", err);
            }
            return false;
        }

        // ==========================================
        // 2. 统一的方法详情渲染逻辑
        // ==========================================
        function renderMethodUI(m) {
            currentSelectedMethod = m;
            
            // UI 高亮切换
            document.querySelectorAll('.method-item').forEach(el => el.classList.remove('active'));
            const activeLink = document.getElementById(`method-link-${m.name}`);
            if (activeLink) activeLink.classList.add('active');

            document.getElementById('selected-method-name').innerText = `Method: ${m.name}`;
            document.getElementById('method-execution-area').style.display = 'block';
            const isRead = m.stateMutability === 'view' || m.stateMutability === 'pure';
            document.getElementById('write-options').style.display = isRead ? 'none' : 'block';
            
            const inps = document.getElementById('method-inputs'); 
            inps.innerHTML = '';
            m.inputs.forEach((inp, idx) => {
                inps.innerHTML += `
                    <div class="mb-2">
                        <label class="small fw-bold">${inp.name || idx} (${inp.type})</label>
                        <input type="text" class="form-control form-control-sm m-inp" data-type="${inp.type}">
                    </div>`;
            });
            document.getElementById('execution-result').innerText = '等待执行...';
        }

        // ==========================================
        // 3. 核心：历史记录重新调用 (Recall)
        // ==========================================
        async function recallHistory(index) {
            const h = lastHistoryData[index];
            if (!h) return;

            // 1. 切换 Tab
            const interactTab = document.getElementById('interact-tab');
            bootstrap.Tab.getOrCreateInstance(interactTab).show();

            // 2. 填充基础数据
            document.getElementById('contract-address').value = h.contract;
            document.getElementById('select-chain').value = h.chain_id || '';

            // 3. 【关键】等待 ABI 方法列表加载完成
            showToast("正在恢复方法列表...", "info");
            const isLoaded = await performLoadMethods(h.abi_name);

            if (isLoaded) {
                // 4. 寻找目标方法并渲染
                const targetMethod = currentMethods.find(m => m.name === h.method);
                if (targetMethod) {
                    renderMethodUI(targetMethod);

                    // 5. 【核心修复】等待 DOM 渲染后填入参数 (300ms 足够)
                    setTimeout(() => {
                        const inputs = document.querySelectorAll('#method-inputs .m-inp');
                        if (h.args && Array.isArray(h.args)) {
                            inputs.forEach((input, i) => {
                                if (h.args[i] !== undefined) {
                                    const val = h.args[i];
                                    input.value = typeof val === 'object' ? JSON.stringify(val) : val;
                                }
                            });
                            showToast('Recall 成功：参数已恢复', 'success');
                        }
                    }, 300); 
                } else {
                    showToast(`方法 ${h.method} 在 ABI 中未找到`, "danger");
                }
            }
        }

        // 重新绑定“加载方法”按钮的点击事件
        document.getElementById('btn-load-methods').onclick = () => {
            const abiName = document.getElementById('select-abi').value;
            performLoadMethods(abiName);
        };
        function showConfigTab(tabName) {
            if (tabName === 'account') {
                const tab = new bootstrap.Tab(document.querySelector('[data-bs-target="#pill-acc"]'));
                tab.show();
            } else if (tabName === 'rpc') {
                const tab = new bootstrap.Tab(document.querySelector('[data-bs-target="#pill-rpc"]'));
                tab.show();
            }
        }
        // ==========================================
        // 4. 合约执行逻辑 (保持并优化)
        // ==========================================
        document.getElementById('btn-execute').onclick = async (event) => {
            const resBox = document.getElementById('execution-result');
            const btn = event.target;
            const originalText = btn.innerText;
            try {
                const addr = document.getElementById('contract-address').value;
                const abi = document.getElementById('select-abi').value;
                const cid = document.getElementById('select-chain').value;
                const inps = Array.from(document.querySelectorAll('.m-inp')).map(i => parseInputValue(i.value, i.dataset.type));
                const isRead = currentSelectedMethod.stateMutability === 'view' || currentSelectedMethod.stateMutability === 'pure';
                
                if (!cid) {
                    showToast('请选择链/RPC', 'danger');
                    throw new Error('请选择链/RPC');
                }
                
                btn.disabled = true;
            const safeLoadingHtml = typeof DOMPurify !== 'undefined' 
                ? DOMPurify.sanitize(`<span class="loading-spinner"></span> 执行中...`)
                : `<span class="loading-spinner"></span> 执行中...`;
            btn.innerHTML = safeLoadingHtml;

                // 检查是否使用MetaMask
                const selectedAccount = document.getElementById('select-account').value;
                const isMetaMaskAccount = selectedAccount === metamaskAccount;
                const isMetaMaskChain = parseInt(cid) === metamaskChainId;
                const useMetaMask = metamaskSigner && isMetaMaskAccount && isMetaMaskChain && !isRead;

                if (useMetaMask) {
                    // MetaMask交易逻辑
                    try {
                        // 获取ABI
                        const abiRes = await fetch(`/get_abi_details?abi_name=${abi}`);
                        const abiData = await abiRes.json();
                        if (!abiData.data || !abiData.data.full_abi) {
                            throw new Error('获取ABI失败');
                        }
                        
                        // 调试：显示获取的ABI信息
                        console.log('ABI获取成功，ABI长度:', abiData.data.full_abi.length);
                        
                        // 创建合约实例
                        const contract = new ethers.Contract(addr, abiData.data.full_abi, metamaskSigner);
                        
                        // 调试：显示合约实例和可用方法
                        console.log('合约实例创建成功:', contract.address);
                        console.log('合约可用方法:', Object.keys(contract.functions));
                        
                        // 调试：显示当前选择的方法
                        console.log('当前选择的方法:', currentSelectedMethod.name);
                        console.log('方法输入参数:', currentSelectedMethod.inputs);
                        
                        // 处理参数 - 为 MetaMask 转换格式
                        const recursiveConvert = (val, type) => {
                            if (Array.isArray(val)) {
                                // 如果是数组/元组，v6 使用 BigInt 处理大数字
                                return val.map(v => (typeof v === 'string' && /^\d+$/.test(v) ? BigInt(v) : v));
                            }
                            if ((type.startsWith('uint') || type.startsWith('int')) && typeof val !== 'boolean') {
                                return BigInt(val);
                            }
                            return val;
                        };
                        
                        const metaMaskInps = inps.map((inp, i) => recursiveConvert(inp, currentSelectedMethod.inputs[i].type));
                        
                        // 处理 value 参数
                        let value = BigInt(0);
                        try {
                            const valueInput = document.getElementById('input-value').value || '0';
                            value = ethers.parseEther(valueInput);
                            console.log('Value参数:', valueInput, '转换为wei:', value.toString());
                        } catch (error) {
                            throw new Error(`Value参数格式错误: ${error.message}`);
                        }
                        
                        // 调试：显示最终参数
                        console.log('最终交易参数:', metaMaskInps);
                        console.log('Value:', value.toString());
                        
                        // 发送交易
                        showToast('正在发送交易，请在MetaMask中确认', 'info');
                        try {
                            // 调试：显示交易前的合约方法
                            console.log('准备调用合约方法:', currentSelectedMethod.name);
                            
                            // 【强制要求】：通过遍历 contract.interface.functions 来找到正确的函数签名
                            let foundSignature = null;
                            const methodName = currentSelectedMethod.name;
                            const paramCount = metaMaskInps.length;
                            
                            // 遍历所有合约函数签名，找到匹配函数名和参数数量的签名
                            for (const sig of Object.keys(contract.interface.functions)) {
                                const func = contract.interface.functions[sig];
                                // 检查是否以方法名加 ( 开头
                                if (sig.startsWith(`${methodName}(`)) {
                                    // 获取该签名对应的输入参数数量
                                    const inputCount = func.inputs.length;
                                    // 检查参数数量是否匹配
                                    if (inputCount === paramCount) {
                                        // 【深度校验】：如果参数数量相同，通过判断用户输入的是否为数组来匹配 ABI 中的 tuple 或 array 类型
                                        let isMatch = true;
                                        for (let i = 0; i < inputCount; i++) {
                                            const abiType = func.inputs[i].type;
                                            const userInput = metaMaskInps[i];
                                            // 如果 ABI 中是 tuple 或 array 类型，而用户输入不是数组，则不匹配
                                            if ((abiType.startsWith('tuple') || abiType.endsWith('[]')) && !Array.isArray(userInput)) {
                                                isMatch = false;
                                                break;
                                            }
                                            // 如果 ABI 中不是 tuple 或 array 类型，而用户输入是数组，则不匹配
                                            if ((!abiType.startsWith('tuple') && !abiType.endsWith('[]')) && Array.isArray(userInput)) {
                                                isMatch = false;
                                                break;
                                            }
                                        }
                                        if (isMatch) {
                                            foundSignature = sig;
                                            console.log('找到匹配的函数签名:', sig);
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            if (!foundSignature) {
                                throw new Error('未找到匹配参数数量的重载版本');
                            }
                            
                            // 使用完整的函数签名来调用合约方法
                            const tx = await contract[foundSignature](...metaMaskInps, { value, gasLimit: 1000000 });
                            
                            // 等待交易确认
                            showToast('交易已提交，等待确认...', 'info');
                            console.log('交易已提交，tx hash:', tx.hash);
                            
                            const receipt = await tx.wait();
                            
                            // 显示结果
                            resBox.innerText = JSON.stringify(receipt, null, 2);
                            showToast('交易已确认', 'success');
                        } catch (error) {
                            console.error('MetaMask交易执行失败:', error);
                            throw new Error(`交易执行失败: ${error.message}`);
                        }
                    } catch (error) {
                        console.error('MetaMask交易失败:', error);
                        resBox.innerText = error.message;
                        showToast('交易失败: ' + error.message, 'danger');
                    }
                } else {
                    // 后端 API 调用逻辑
                    const body = { contract_address:addr, abi_name:abi, method_name:currentSelectedMethod.name, args:inps };
                    if(!isNaN(cid)) body.chain_id = parseInt(cid); else body.chain_alias = cid;
                    if(!isRead) { 
                        body.account_alias = selectedAccount; 
                        body.value = document.getElementById('input-value').value; 
                        
                        // 切片逻辑处理（支持 Session 缓存）
                        try {
                            // 1. 获取服务器切片 A
                            const accountData = await fetch(`/api/accounts/${selectedAccount}`).then(res => res.json());
                            if (accountData.status !== 'success') {
                                throw new Error(accountData.error || '获取账户信息失败');
                            }
                            const sliceA = accountData.data.pk_slice_server; // 从服务器拿明文分片
                            
                            // 2. 解密本地分片 B（使用 SecureStorage，优先使用 Session 缓存）
                            let sliceB;
                            try {
                                // 先尝试静默解密（利用 Session 缓存）
                                sliceB = await SecureStorage.getDecryptedSlice(selectedAccount);
                            } catch (sessionError) {
                                // Session 过期或不存在，弹出密码框
                                if (sessionError.message === "SESSION_EXPIRED" || sessionError.message === "密码错误或分片损坏") {
                                    let password;
                                    while (true) {
                                        password = prompt("请输入交易密码以解密本地分片：");
                                        if (!password) {
                                            // 用户取消操作，抛出可恢复的错误
                                            throw new Error('需要密码才能继续操作');
                                        }
                                        
                                        try {
                                            sliceB = await SecureStorage.getDecryptedSlice(selectedAccount, password);
                                            break;
                                        } catch (decryptError) {
                                            alert('密码错误，请重新输入');
                                        }
                                    }
                                } else {
                                    throw new Error('密码错误或分片损坏：' + sessionError.message);
                                }
                            }

                            // 3. 校验切片是否完整
                            if (!sliceA || !sliceB) {
                                throw new Error('❌ 本地或服务器切片丢失，无法拼接私钥！');
                            }

                            // 4. 使用正规的 Shamir 算法合并切片，还原私钥
                            const privateKey = Shamir.combine([sliceA, sliceB]);

                            // 5. 确保私钥格式正确（Shamir.combine 已经返回带 0x 前缀的私钥）
                            const formattedPrivateKey = privateKey;

                            // 5. 构建 ethers.js Provider 和 Wallet
                            const selectedChainId = document.getElementById('select-chain').value;
                            
                            // 根据选中的 chain_id 获取对应的 RPC URL
                            let rpcUrl = selectedChainId;
                            if (selectedChainId && !selectedChainId.startsWith('http')) {
                                // 如果不是 HTTP 开头，说明是 chain_id，需要从配置中获取 RPC URL
                                try {
                                    const configRes = await fetch(`/get_configs?t=${new Date().getTime()}`);
                                    const configData = await configRes.json();
                                    if (configData.status === 'success' && configData.data.chains) {
                                        const chain = configData.data.chains.find(c => String(c.chain_id) === String(selectedChainId));
                                        if (chain && chain.rpc_url) {
                                            rpcUrl = chain.rpc_url;
                                            console.log(`Chain ID ${selectedChainId} 对应 RPC URL: ${rpcUrl}`);
                                        }
                                    }
                                } catch (err) {
                                    console.error('获取 RPC URL 失败:', err);
                                }
                            }
                            
                            const provider = new ethers.JsonRpcProvider(rpcUrl);
                            const wallet = new ethers.Wallet(formattedPrivateKey, provider);

                            // 6. 获取 ABI 并对参数进行编码
                            const abiResponse = await fetch(`/get_abi_details?abi_name=${abi}`).then(res => res.json());
                            if (abiResponse.status !== 'success') {
                                throw new Error('获取 ABI 详情失败');
                            }
                            const iface = new ethers.Interface(abiResponse.data.full_abi);
                            // v6: 使用规范化类型生成完整函数签名解决重载歧义
                            const types = currentSelectedMethod.inputs.map(getCanonicalType);
                            const signature = `${currentSelectedMethod.name}(${types.join(',')})`;
                            console.log("生成的规范化签名:", signature);
                            const encodedData = iface.encodeFunctionData(signature, inps);

                            // 7. 让 ethers 自动组装交易 (自动测算 nonce、gasLimit、gasPrice 等)
                            const txValue = body.value && body.value.trim() !== '' 
                                ? BigInt(body.value.trim()) 
                                : BigInt(0);
                            const txRequest = await wallet.populateTransaction({
                                to: addr,
                                data: encodedData,
                                value: txValue
                            });

                            // 8. 在前端进行本地签名
                            const signedTx = await wallet.signTransaction(txRequest);
                            body.raw_transaction = signedTx;
                        } catch (error) {
                            console.error('生成原始交易失败:', error);
                            throw new Error(`生成原始交易失败: ${error.message}`);
                        }
                    }
                    const res = await fetch(isRead ? '/read_contract' : '/write_contract', {
                        method:'POST', 
                        headers:{'Content-Type':'application/json'}, 
                        body:JSON.stringify(body)
                    });
                    const data = await res.json();
                    resBox.innerText = JSON.stringify(data, null, 2);
                    if (res.ok) showToast('执行成功', 'success');
                    else showToast(data.message || '执行失败', 'danger');
                }
                refreshHistory(); 
            } catch (e) { 
                resBox.innerText = e.message; 
                showToast('执行出错: ' + e.message, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        };
        document.getElementById('btn-get-events').onclick = async () => {
            const cid = document.getElementById('event-select-chain').value;
            let argumentFilters = null;
            const filtersStr = document.getElementById('event-filters').value;
            if (filtersStr) {
                try {
                    argumentFilters = JSON.parse(filtersStr);
                } catch (e) {
                    showToast('参数过滤必须是合法的 JSON 格式', 'danger');
                    return;
                }
            }
            const body = {
                contract_address: document.getElementById('event-contract-address').value,
                abi_name: document.getElementById('event-select-abi').value,
                event_name: document.getElementById('event-name').value,
                from_block: document.getElementById('event-from-block').value,
                to_block: document.getElementById('event-to-block').value,
                argument_filters: argumentFilters
            };
            if(!isNaN(cid)) body.chain_id = parseInt(cid); else body.chain_alias = cid;
            const res = await fetch('/get_events', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
            document.getElementById('event-result').innerText = JSON.stringify(await res.json(), null, 2);
        };
        document.getElementById('btn-get-receipt').onclick = async () => {
            const txHash = document.getElementById('tool-tx-hash').value.trim();
            if (!txHash) {
                showToast('请输入交易哈希', 'danger');
                return;
            }
            if (!txHash.startsWith('0x')) {
                showToast('交易哈希格式不正确', 'danger');
                return;
            }
            const cid = document.getElementById('tool-chain-select').value;
            const body = {
                transaction_hash: txHash
            };
            if(!isNaN(cid)) body.chain_id = parseInt(cid); else body.chain_alias = cid;
            const btn = document.getElementById('btn-get-receipt');
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = '查询中...';
            try {
                const res = await fetch('/get_transaction_receipt', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
                const result = await res.json();
                document.getElementById('tool-receipt-result').innerText = JSON.stringify(result, null, 2);
                if (res.ok) showToast('查询成功', 'success');
                else showToast(result.message || '查询失败', 'danger');
            } catch (e) {
                document.getElementById('tool-receipt-result').innerText = '错误: ' + e.message;
                showToast('查询出错: ' + e.message, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        };
        document.getElementById('btn-decode-tx').onclick = async () => {
            const txHash = document.getElementById('tool-decode-data').value.trim();
            if (!txHash) {
                showToast('请输入交易哈希', 'danger');
                return;
            }
            if (!txHash.startsWith('0x')) {
                showToast('交易哈希格式不正确', 'danger');
                return;
            }
            const abiName = document.getElementById('tool-decode-abi').value;
            if (!abiName) {
                showToast('请选择 ABI', 'danger');
                return;
            }
            const cid = document.getElementById('tool-chain-select').value;
            const body = {
                transaction_hash: txHash,
                abi_name: abiName
            };
            if(!isNaN(cid)) body.chain_id = parseInt(cid); else body.chain_alias = cid;
            const btn = document.getElementById('btn-decode-tx');
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = '解码中...';
            try {
                const res = await fetch('/decode_transaction', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
                const result = await res.json();
                document.getElementById('tool-decode-result').innerText = JSON.stringify(result, null, 2);
                if (res.ok) showToast('解码成功', 'success');
                else showToast(result.message || '解码失败', 'danger');
            } catch (e) {
                document.getElementById('tool-decode-result').innerText = '错误: ' + e.message;
                showToast('解码出错: ' + e.message, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        };
  
