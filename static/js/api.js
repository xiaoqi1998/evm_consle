// api.js - Account API wrapper for backend communication

const accountAPI = {
    /**
     * 获取 API Token
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem('evm_api_token');
    },

    /**
     * 获取请求头（包含 Token）
     * @returns {Object}
     */
    getHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['X-API-Token'] = token;
        }
        return headers;
    },

    /**
     * 保存账户到服务器
     * @param {string} alias - 账户别名
     * @param {string} address - 钱包地址
     * @param {string} pkSliceServer - 私钥分片 A（服务器端）
     * @returns {Promise<Object>}
     */
    async saveAccount(alias, address, pkSliceServer) {
        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                alias,
                address,
                pk_slice_server: pkSliceServer
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '保存账户失败');
        }
        return data;
    },

    /**
     * 获取账户信息
     * @param {string} alias - 账户别名
     * @returns {Promise<Object>}
     */
    async getAccount(alias) {
        const response = await fetch(`/api/accounts/${alias}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '获取账户信息失败');
        }
        return data;
    },

    /**
     * 删除账户
     * @param {string} alias - 账户别名
     * @returns {Promise<Object>}
     */
    async deleteAccount(alias) {
        const response = await fetch(`/api/accounts/${alias}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '删除账户失败');
        }
        return data;
    },

    /**
     * 获取所有账户列表
     * @returns {Promise<Array>}
     */
    async getAccounts() {
        const response = await fetch('/get_configs', {
            method: 'GET',
            headers: this.getHeaders()
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '获取账户列表失败');
        }
        return data.data.accounts || [];
    }
};

// 暴露到全局作用域
window.accountAPI = accountAPI;
