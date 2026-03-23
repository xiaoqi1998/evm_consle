// crypto-utils.js - Shamir's Secret Sharing and AES encryption

// 使用 js-shamir 库（已通过 CDN 引入）
// 该库经过社区审计，提供生产级的 Shamir's Secret Sharing 实现
// 文档: https://github.com/raviqqe/shamir-js

// Shamir's Secret Sharing implementation using js-shamir
class Shamir {
    static share(secretHex, numShares, threshold) {
        // 1. 检查库是否加载。secrets.js-grempe 使用全局变量 secrets
        if (typeof secrets === 'undefined') throw new Error('secrets.js 库未加载');

        // 2. 处理前缀。该库喜欢纯十六进制
        let secret = secretHex;
        if (secret.startsWith('0x')) {
            secret = secret.slice(2);
        }

        // 3. 生成分片
        // secrets.share(秘密, 总份数, 门限)
        // 注意：该库生成的分享默认带索引前缀（例如 "101xxxx"），非常适合直接保存
        const shares = secrets.share(secret, numShares, threshold);
        
        return shares;
    }

    static combine(shares) {
        if (typeof secrets === 'undefined') throw new Error('secrets.js 库未加载');
        
        // 4. 合并分片
        const combined = secrets.combine(shares);
        
        // 5. 确保返回 0x 前缀格式
        return combined.startsWith('0x') ? combined : '0x' + combined;
    }
}

// AES Encryption (修复动态 Salt)
class AES {
    static async encrypt(plaintext, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        
        // 生成随机 Salt (16字节) 和 IV (12字节)
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
        );
        const key = await window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: 600000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt']
        );
        
        const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
        
        // 拼接结构: Salt (16) + IV (12) + 密文
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        return btoa(String.fromCharCode(...result));
    }
    
    static async decrypt(ciphertext, password) {
        const data = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
        
        // 提取 Salt, IV 和密文
        const salt = data.slice(0, 16);
        const iv = data.slice(16, 28);
        const encrypted = data.slice(28);
        
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false,['deriveKey']
        );
        const key = await window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: salt, iterations: 600000, hash: 'SHA-256' },
            keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['decrypt']
        );
        
        const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
        return new TextDecoder().decode(decrypted);
    }
}

window.Shamir = Shamir;
window.AES = AES;

// ==========================================
// SecureStorage - 基于用户账户的本地分片加密存储（带 Session 缓存）
// ==========================================
const SecureStorage = {
    // 内存缓存：不存储密码，只存储生成的密钥对象和过期时间
    _session: {
        key: null,
        expiresAt: 0,
        alias: null // 确保不同账户切换时密码重校验
    },

    // 内部方法：获取有效的 Session Key
    _getSessionKey(alias) {
        const now = Date.now();
        if (this._session.key && this._session.alias === alias && now < this._session.expiresAt) {
            return this._session.key;
        }
        return null;
    },

    // 内部方法：设置 Session Key，30 分钟有效
    _setSessionKey(alias, key) {
        this._session = {
            key: key,
            alias: alias,
            expiresAt: Date.now() + (2 * 60 * 1000) // 30 分钟
        };
        console.log(`[SecureStorage] Session 已设置，有效截止到：${new Date(this._session.expiresAt).toLocaleTimeString()}`);
    },

    // 内部方法：清除 Session
    _clearSession() {
        this._session = {
            key: null,
            expiresAt: 0,
            alias: null
        };
        console.log('[SecureStorage] Session 已清除');
    },

    // 使用 PBKDF2 算法从密码推导出强密钥
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey(
            "raw", 
            encoder.encode(password), 
            "PBKDF2", 
            false, 
            ["deriveKey"]
        );
        
        return window.crypto.subtle.deriveKey(
            { 
                name: "PBKDF2", 
                salt: encoder.encode(salt), 
                iterations: 600000, 
                hash: "SHA-256" 
            },
            baseKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    },

    // 加密分片并存入 localStorage
    async saveEncryptedSlice(alias, sliceB, password) {
        try {
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const key = await this.deriveKey(password, salt);
            
            const encrypted = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                key,
                new TextEncoder().encode(sliceB)
            );
            
            // 将 Salt、IV 和密文拼接存储
            const result = {
                salt: Array.from(salt),
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encrypted))
            };
            
            localStorage.setItem(`account_${alias}_sliceB_enc`, JSON.stringify(result));
            
            // 加密成功后自动缓存 Session Key
            this._setSessionKey(alias, key);
            
            return true;
        } catch (error) {
            console.error('加密分片失败:', error);
            throw new Error('加密分片失败：' + error.message);
        }
    },

    // 解密本地分片（核验逻辑：支持 Session 缓存）
    async getDecryptedSlice(alias, password = null) {
        try {
            const stored = localStorage.getItem(`account_${alias}_sliceB_enc`);
            if (!stored) {
                throw new Error("未找到加密分片，请确认是否清除了浏览器缓存");
            }
            
            const parsed = JSON.parse(stored);

            // 1. 先尝试从 Session 缓存获取 Key
            let key = this._getSessionKey(alias);

            // 2. 如果没有缓存的 Key 且用户没有传密码，抛出 SESSION_EXPIRED 错误
            if (!key) {
                if (!password) {
                    // 这里抛出一个特定错误，由 index.js 获取并触发 prompt
                    throw new Error("SESSION_EXPIRED");
                }
                // 用传入的密码和存储的 salt 推导 Key
                const salt = new Uint8Array(parsed.salt);
                key = await this.deriveKey(password, salt);
                // 注意：先不设置 Session，等解密成功后再设置
            }

            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: new Uint8Array(parsed.iv) },
                key,
                new Uint8Array(parsed.data)
            );
            
            // 解密成功后才设置 Session
            if (!this._getSessionKey(alias)) {
                this._setSessionKey(alias, key);
            }
            
            return new TextDecoder().decode(decrypted);
        } catch (error) {
            // 如果是 SESSION_EXPIRED 错误，直接抛出，不清除 Session
            if (error.message === "SESSION_EXPIRED") {
                throw error;
            }
            
            // 如果解密失败（可能是密码错误、Session 被清除或数据损坏）
            // 更精确的错误类型判断：包括现代浏览器可能返回的各种错误类型
            const isPasswordError = error.name === 'CryptoError' || 
                                  error.name === 'InvalidCharacterError' ||
                                  error.name === 'OperationError' ||
                                  error.name === 'DOMException' ||
                                  error.message.includes('decryption') ||
                                  error.message.includes('password') ||
                                  error.message.includes('key') ||
                                  error.message.includes('authentication');
            
            if (isPasswordError) {
                this._clearSession();
                throw new Error('密码错误或分片损坏');
            }
            // 如果是其他错误（如 SESSION_EXPIRED），直接抛出
            throw error;
        }
    },

    // 检查是否存在加密分片
    hasEncryptedSlice(alias) {
        return !!localStorage.getItem(`account_${alias}_sliceB_enc`);
    },

    // 删除加密分片
    removeEncryptedSlice(alias) {
        localStorage.removeItem(`account_${alias}_sliceB_enc`);
        // 如果删除的是当前 Session 对应的账户，清除 Session
        if (this._session.alias === alias) {
            this._clearSession();
        }
    },

    // 手动清除 Session（用于用户主动注销）
    clearSession() {
        this._clearSession();
    },

    // 检查 Session 是否有效
    isSessionValid(alias) {
        const now = Date.now();
        return this._session.key && this._session.alias === alias && now < this._session.expiresAt;
    },

    // 获取 Session 过期时间
    getSessionExpiryTime(alias) {
        if (this._session.alias !== alias || !this._session.key) {
            return null;
        }
        return this._session.expiresAt;
    },

    // 修改密码：使用旧密码解密，再用新密码加密
    async changePassword(alias, oldPassword, newPassword) {
        try {
            // 1. 用旧密码解密
            const sliceB = await this.getDecryptedSlice(alias, oldPassword);
            
            // 2. 用新密码重新加密
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const key = await this.deriveKey(newPassword, salt);
            
            const encrypted = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                key,
                new TextEncoder().encode(sliceB)
            );
            
            // 3. 更新存储
            const result = {
                salt: Array.from(salt),
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encrypted))
            };
            
            localStorage.setItem(`account_${alias}_sliceB_enc`, JSON.stringify(result));
            
            // 4. 更新 Session 缓存
            this._setSessionKey(alias, key);
            
            return true;
        } catch (error) {
            console.error('修改密码失败:', error);
            if (error.message.includes('密码错误') || error.message.includes('SESSION_EXPIRED')) {
                throw new Error('旧密码错误');
            }
            throw new Error('修改密码失败：' + error.message);
        }
    }
};

// 暴露到全局
window.SecureStorage = SecureStorage;
