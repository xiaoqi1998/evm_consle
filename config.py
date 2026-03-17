# 配置文件

# 全局默认 RPC URL 配置（所有用户自动拥有，无需在数据库存储）
# 可以在此处直接更新 RPC 地址，全站立即生效
# 测试链 RPC 配置（建议仅在测试链上使用）
GLOBAL_DEFAULT_RPCS = [
    {"chain_id": "11155111", "alias": "Sepolia (Ethereum)", "rpc_url": "https://sepolia.infura.io/v3/cb1d33116ae74dbc8cd42218bd0ad026"},
    {"chain_id": "11155111", "alias": "Sepolia-Public", "rpc_url": "https://ethereum-sepolia.publicnode.com"},
    {"chain_id": "97", "alias": "BSC Testnet", "rpc_url": "https://data-seed-prebsc-1-s1.binance.org:8545/"},
    {"chain_id": "80002", "alias": "Polygon Amoy", "rpc_url": "https://rpc-amoy.polygon.technology"},
    {"chain_id": "421614", "alias": "Arbitrum Sepolia", "rpc_url": "https://sepolia-rollup.arbitrum.io/rpc"},
    {"chain_id": "11155420", "alias": "Optimism Sepolia", "rpc_url": "https://sepolia.optimism.io"},
    {"chain_id": "84532", "alias": "Base Sepolia", "rpc_url": "https://sepolia.base.org"},
    {"chain_id": "43113", "alias": "Avalanche Fuji", "rpc_url": "https://api.avax-test.network/ext/bc/C/rpc"},
    {"chain_id": "4002", "alias": "Fantom Testnet", "rpc_url": "https://rpc.testnet.fantom.network"},
    {"chain_id": "59141", "alias": "Linea Sepolia", "rpc_url": "https://rpc.sepolia.linea.build"},
    {"chain_id": "534351", "alias": "Scroll Sepolia", "rpc_url": "https://sepolia-rpc.scroll.io"},
]

# 向后兼容
DEFAULT_RPC_URLS = GLOBAL_DEFAULT_RPCS
TESTNET_RPC_URLS = GLOBAL_DEFAULT_RPCS
