# 配置文件

# 全局默认 RPC URL 配置（所有用户自动拥有，无需在数据库存储）
# 可以在此处直接更新 RPC 地址，全站立即生效
GLOBAL_DEFAULT_RPCS = [
    {"chain_id": "1", "alias": "Ethereum-1", "rpc_url": "https://eth.llamarpc.com"},
    {"chain_id": "1", "alias": "Ethereum-Ankr", "rpc_url": "https://rpc.ankr.com/eth"},
    {"chain_id": "1", "alias": "Ethereum-Cloudflare", "rpc_url": "https://cloudflare-eth.com"},
    {"chain_id": "1", "alias": "Ethereum-Public", "rpc_url": "https://ethereum.publicnode.com"},
    {"chain_id": "56", "alias": "BSC-1", "rpc_url": "https://bsc-dataseed.binance.org/"},
    {"chain_id": "56", "alias": "BSC-Ankr", "rpc_url": "https://rpc.ankr.com/bsc"},
    {"chain_id": "56", "alias": "BSC-Public", "rpc_url": "https://bsc-rpc.publicnode.com"},
    {"chain_id": "56", "alias": "BSC-Defibit", "rpc_url": "https://bsc-dataseed1.defibit.io/"},
    {"chain_id": "137", "alias": "Polygon-1", "rpc_url": "https://polygon-rpc.com/"},
    {"chain_id": "137", "alias": "Polygon-Ankr", "rpc_url": "https://rpc.ankr.com/polygon"},
    {"chain_id": "137", "alias": "Polygon-Llama", "rpc_url": "https://polygon.llamarpc.com"},
    {"chain_id": "137", "alias": "Polygon-Public", "rpc_url": "https://polygon-bor.publicnode.com"},
    {"chain_id": "42161", "alias": "Arbitrum-1", "rpc_url": "https://arb1.arbitrum.io/rpc"},
    {"chain_id": "42161", "alias": "Arbitrum-Ankr", "rpc_url": "https://rpc.ankr.com/arbitrum"},
    {"chain_id": "42161", "alias": "Arbitrum-Llama", "rpc_url": "https://arbitrum.llamarpc.com"},
    {"chain_id": "42161", "alias": "Arbitrum-Public", "rpc_url": "https://arbitrum-one.publicnode.com"},
    {"chain_id": "10", "alias": "Optimism-1", "rpc_url": "https://mainnet.optimism.io"},
    {"chain_id": "10", "alias": "Optimism-Ankr", "rpc_url": "https://rpc.ankr.com/optimism"},
    {"chain_id": "10", "alias": "Optimism-Llama", "rpc_url": "https://optimism.llamarpc.com"},
    {"chain_id": "10", "alias": "Optimism-Public", "rpc_url": "https://optimism-mainnet.publicnode.com"},
    {"chain_id": "8453", "alias": "Base-1", "rpc_url": "https://mainnet.base.org"},
    {"chain_id": "8453", "alias": "Base-Ankr", "rpc_url": "https://rpc.ankr.com/base"},
    {"chain_id": "8453", "alias": "Base-Llama", "rpc_url": "https://base.llamarpc.com"},
    {"chain_id": "8453", "alias": "Base-Public", "rpc_url": "https://base-rpc.publicnode.com"},
    {"chain_id": "43114", "alias": "Avalanche-1", "rpc_url": "https://api.avax.network/ext/bc/C/rpc"},
    {"chain_id": "43114", "alias": "Avalanche-Ankr", "rpc_url": "https://rpc.ankr.com/avalanche"},
    {"chain_id": "43114", "alias": "Avalanche-Public", "rpc_url": "https://avalanche.publicnode.com"},
    {"chain_id": "250", "alias": "Fantom-1", "rpc_url": "https://rpc.ftm.tools/"},
    {"chain_id": "250", "alias": "Fantom-Ankr", "rpc_url": "https://rpc.ankr.com/fantom"},
    {"chain_id": "250", "alias": "Fantom-Public", "rpc_url": "https://fantom.publicnode.com"},
]

# 向后兼容
DEFAULT_RPC_URLS = GLOBAL_DEFAULT_RPCS
TESTNET_RPC_URLS = GLOBAL_DEFAULT_RPCS
