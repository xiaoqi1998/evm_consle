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
        'backup_code': 'Backup Code (Save this securely!)',
        
        // QR Code Backup
        'qr_backup_title': 'Save Your "Security QR Code"',
        'qr_backup_warning': 'This is the only credential for recovering this account. When you change devices or clear browser data, you must use this code to retrieve your assets.',
        'qr_backup_alert': '<strong class="text-danger">Do not store this QR code in your phone gallery or cloud.</strong> It is recommended to print it or store it in a physical encrypted USB drive. If this code is leaked, hackers can directly steal your funds after gaining access to your login credentials.',
        'qr_backup_verify': 'Please verify the following information carefully:',
        'qr_backup_alias': 'Account Alias:',
        'qr_backup_address': 'Account Address:',
        'qr_backup_slice': 'Slice Type:',
        'qr_backup_download': 'Download Security Image',
        'qr_backup_confirm': 'I have saved it offline, next step',
        'qr_recovery_title': 'Scan to Recover Assets',
        'qr_recovery_guide': 'Local security slice missing detected. Please upload or scan the "Security QR Code" for this account to reactivate it.',
        'qr_recovery_select': 'Select Recovery Method',
        'qr_recovery_upload': 'Click to upload QR code image',
        'qr_recovery_camera': 'Enable camera to scan',
        'qr_recovery_scanning': 'Scanning...',
        'qr_recovery_success': 'Parsed successfully, connecting to server to sync slice A...',
        'qr_recovery_error': 'Error:',
        'qr_recovery_alias_mismatch': 'QR code account alias does not match!',
        'qr_restore_success': 'Account restored successfully! Please set a new transaction password.',
        'qr_restore_failed': 'Restore failed:'
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
        'backup_code': '备份码 (安全保存！)',
        
        // QR Code Backup
        'qr_backup_title': '保存您的"密保二维码"',
        'qr_backup_warning': '这是恢复该账户的唯一凭证。当您更换设备或清空浏览器数据时，必须使用此码找回资产。',
        'qr_backup_alert': '<strong class="text-danger">请勿将此二维码存入手机相册或云端。</strong>建议直接打印，或存入物理加密U盘。一旦此码泄露，黑客在获取您的登录权限后可直接盗取资金。',
        'qr_backup_verify': '请仔细核对以下信息：',
        'qr_backup_alias': '账户别名：',
        'qr_backup_address': '账户地址：',
        'qr_backup_slice': '切片类型：',
        'qr_backup_download': '下载密保图片',
        'qr_backup_confirm': '我已离线保存，下一步',
        'qr_recovery_title': '扫码恢复资产',
        'qr_recovery_guide': '检测到本地安全分片缺失。请上传或扫描该账户的"密保二维码"以重新激活。',
        'qr_recovery_select': '选择恢复方式',
        'qr_recovery_upload': '点击上传二维码图片',
        'qr_recovery_camera': '开启摄像头扫码',
        'qr_recovery_scanning': '扫码中...',
        'qr_recovery_success': '解析成功，正在连接服务器同步分片 A...',
        'qr_recovery_error': '错误：',
        'qr_recovery_alias_mismatch': '二维码中的账户别名不匹配！',
        'qr_restore_success': '账户恢复成功！请设置新的交易密码。',
        'qr_restore_failed': '恢复失败：'
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
