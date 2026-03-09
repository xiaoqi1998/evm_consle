// i18n.js - Translation module
const translations = {
    en: {
        'welcome': 'Welcome to EVM API',
        'login': 'Login',
        'register': 'Register',
        'logout': 'Logout',
        'username': 'Username',
        'password': 'Password',
        'account': 'Account',
        'private_key': 'Private Key',
        'save': 'Save',
        'cancel': 'Cancel',
        'success': 'Success',
        'error': 'Error',
        'warning': 'Warning',
        'accept_risk': 'I ACCEPT ALL RISKS',
        'disclaimer_title': 'IMPORTANT DISCLAIMER',
        'disclaimer_content': `
            <h3>AS-IS WARRANTY</h3>
            <p>This software is provided "as is" without warranty of any kind, express or implied.</p>
            
            <h3>NO LIABILITY</h3>
            <p>The authors shall not be liable for any damages arising from the use of this software.</p>
            
            <h3>CUSTODIAL RISK</h3>
            <p>You are solely responsible for the security of your private keys and assets.</p>
        `,
        'transaction_warning': 'WARNING: This transaction will spend funds from your account.',
        'confirm_transaction': 'I confirm this transaction',
        'countdown': 'Please wait {seconds} seconds...',
        'unsafe': '(UNSAFE)',
        'safe': '(SAFE)',
        'password_required': 'Password required',
        'enter_password': 'Enter your access password',
        'recover_account': 'Recover Account',
        'slice_a': 'Slice A (Server)',
        'slice_b': 'Slice B (Local)',
        'slice_c': 'Slice C (Password)',
        'backup_code': 'Backup Code (Save this securely!)'
    },
    zh: {
        'welcome': '欢迎使用 EVM API',
        'login': '登录',
        'register': '注册',
        'logout': '退出',
        'username': '用户名',
        'password': '密码',
        'account': '账户',
        'private_key': '私钥',
        'save': '保存',
        'cancel': '取消',
        'success': '成功',
        'error': '错误',
        'warning': '警告',
        'accept_risk': '我接受所有风险',
        'disclaimer_title': '重要免责声明',
        'disclaimer_content': `
            <h3>按现状提供</h3>
            <p>本软件按"现状"提供，不提供任何明示或暗示的担保。</p>
            
            <h3>无责任</h3>
            <p>作者对因使用本软件而产生的任何损害不承担责任。</p>
            
            <h3>托管风险</h3>
            <p>您对私钥和资产的安全负全部责任。</p>
        `,
        'transaction_warning': '警告：此交易将从您的账户中支出资金。',
        'confirm_transaction': '我确认此交易',
        'countdown': '请等待 {seconds} 秒...',
        'unsafe': '(不安全)',
        'safe': '(安全)',
        'password_required': '需要密码',
        'enter_password': '输入您的访问密码',
        'recover_account': '恢复账户',
        'slice_a': '切片 A (服务器)',
        'slice_b': '切片 B (本地)',
        'slice_c': '切片 C (密码)',
        'backup_code': '备份码 (安全保存！)'
    }
};

function getLang() {
    return localStorage.getItem('lang') || 'en';
}

function t(key) {
    const lang = getLang();
    return translations[lang][key] || key;
}

// 暴露到全局作用域
window.translations = translations;
window.getLang = getLang;
window.t = t;
