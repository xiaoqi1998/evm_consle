// wallet.js - MetaMask interaction and frontend signing

// 导入 ethers.js
if (typeof ethers === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ethers@6.0.0/dist/ethers.min.js';
    document.head.appendChild(script);
}

// 导入 crypto-utils.js
if (typeof Shamir === 'undefined') {
    const script = document.createElement('script');
    script.src = '/static/js/crypto-utils.js';
    document.head.appendChild(script);
}

// Wallet 类
class Wallet {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
    }
    
    async connectMetaMask() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.provider = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();
                this.address = await this.signer.getAddress();
                return this.address;
            } catch (error) {
                console.error('MetaMask connection failed:', error);
                throw error;
            }
        } else {
            throw new Error('MetaMask not detected');
        }
    }
    
    async signTransaction(txData) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const tx = await this.signer.signTransaction(txData);
            return tx;
        } catch (error) {
            console.error('Transaction signing failed:', error);
            throw error;
        }
    }
    
    async signMessage(message) {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const signature = await this.signer.signMessage(message);
            return signature;
        } catch (error) {
            console.error('Message signing failed:', error);
            throw error;
        }
    }
    
    async getBalance() {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const balance = await this.provider.getBalance(this.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Balance fetch failed:', error);
            throw error;
        }
    }
    
    async getChainId() {
        if (!this.provider) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const network = await this.provider.getNetwork();
            return network.chainId;
        } catch (error) {
            console.error('Chain ID fetch failed:', error);
            throw error;
        }
    }
    
    async switchChain(chainId) {
        if (!this.provider) {
            throw new Error('Wallet not connected');
        }
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.toBeHex(chainId) }]
            });
        } catch (error) {
            console.error('Chain switch failed:', error);
            throw error;
        }
    }
    
    static async signWithPrivateKey(privateKey, txData) {
        try {
            const wallet = new ethers.Wallet(privateKey);
            const signedTx = await wallet.signTransaction(txData);
            return signedTx;
        } catch (error) {
            console.error('Private key signing failed:', error);
            throw error;
        }
    }
    
    static async recoverPrivateKeyFromSlices(slices) {
        // Combine slices using Shamir's Secret Sharing
        return Shamir.combine(slices);
    }
}

// 暴露到全局作用域
window.Wallet = Wallet;
