// qrcode-utils.js - QR Code Generation and Scanning for Secret Sharing

// 依赖：qrcode.js (已通过 CDN 引入), jsQR (PC端图片识别), html5-qrcode (手机端扫码)

// ==========================================
// QR Code Generator - 生成密保二维码
// ==========================================
const QRGenerator = {
    // 生成密保数据
    generateBackupData(alias, sliceC) {
        return JSON.stringify({
            v: 1,
            a: alias,
            s: sliceC
        });
    },

    // 生成二维码图片 (Base64)
    async generateQRBase64(data, size = 300) {
        if (typeof QRCode === 'undefined') {
            throw new Error('QRCode 库未加载，请确保已引入 qrcode.js');
        }

        return new Promise((resolve, reject) => {
            const qrContainer = document.createElement('div');
            qrContainer.style.display = 'none';
            document.body.appendChild(qrContainer);

            try {
                new QRCode(qrContainer, {
                    text: data,
                    width: size,
                    height: size,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });

                setTimeout(() => {
                    const qrImg = qrContainer.querySelector('img');
                    if (qrImg && qrImg.src) {
                        document.body.removeChild(qrContainer);
                        resolve(qrImg.src);
                    } else {
                        const qrCanvas = qrContainer.querySelector('canvas');
                        if (qrCanvas) {
                            document.body.removeChild(qrContainer);
                            resolve(qrCanvas.toDataURL('image/png'));
                        } else {
                            document.body.removeChild(qrContainer);
                            reject(new Error('无法生成二维码'));
                        }
                    }
                }, 100);
            } catch (error) {
                document.body.removeChild(qrContainer);
                reject(error);
            }
        });
    },

    // 生成带水印的密保卡片 (HTML)
    async generateBackupCard(alias, sliceC, accountAddress) {
        const backupData = this.generateBackupData(alias, sliceC);
        const qrBase64 = await this.generateQRBase64(backupData);

        const cardHTML = `
            <div class="qr-backup-card">
                <div class="qr-header">
                    <h3>密保二维码</h3>
                    <span class="qr-label">EVM API 密保凭证</span>
                </div>
                <div class="qr-content">
                    <div class="qr-image-container">
                        <img src="${qrBase64}" alt="QR Code" class="qr-image" id="qr-backup-img">
                    </div>
                    <div class="qr-info">
                        <div class="info-item">
                            <span class="info-label">账户别名：</span>
                            <span class="info-value">${alias}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">账户地址：</span>
                            <span class="info-value">${accountAddress || '未提供'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">切片类型：</span>
                            <span class="info-value">切片 C (密码)</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">版本：</span>
                            <span class="info-value">v1.0</span>
                        </div>
                    </div>
                </div>
                <div class="qr-footer">
                    <p class="warning-text">
                        ⚠️ <strong>安全警告：</strong>这是恢复该账户的唯一凭证。请勿存入手机相册或云端，建议打印或存入物理加密U盘。
                    </p>
                    <p class="warning-text danger">
                        ⚠️ <strong>重要提示：</strong>一旦此码泄露，黑客在获取您的登录权限后可直接盗取资金。
                    </p>
                </div>
            </div>
        `;

        return cardHTML;
    },

    // 下载密保图片
    downloadBackupImage(alias, accountAddress) {
        const qrImg = document.getElementById('qr-backup-img');
        if (!qrImg || !qrImg.src) {
            throw new Error('二维码未生成，请先生成二维码');
        }

        const link = document.createElement('a');
        link.href = qrImg.src;
        link.download = `${alias}_Safety_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// ==========================================
// QR Code Scanner - 扫码和图片识别
// ==========================================
const QRScanner = {
    // PC端：上传图片识别
    async scanImageFromFile(file) {
        if (typeof jsQR === 'undefined') {
            throw new Error('jsQR 库未加载，请确保已引入 jsQR');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        try {
                            const data = JSON.parse(code.data);
                            resolve(data);
                        } catch (error) {
                            reject(new Error('二维码数据格式错误'));
                        }
                    } else {
                        reject(new Error('未识别到二维码'));
                    }
                };
                img.src = event.target.result;
            };
            
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    },

    // 手机端：调用摄像头扫码
    async scanWithCamera() {
        if (typeof Html5Qrcode === 'undefined') {
            throw new Error('html5-qrcode 库未加载，请确保已引入 html5-qrcode');
        }

        return new Promise((resolve, reject) => {
            const container = document.createElement('div');
            container.id = 'qr-scanner-container';
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
            `;

            container.innerHTML = `
                <h2 style="margin-bottom: 20px;">扫码恢复资产</h2>
                <div id="qr-code-reader" style="width: 100%; max-width: 400px;"></div>
                <p style="margin: 10px 0;">请将二维码对准扫描框</p>
                <button id="cancel-scan" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
                    取消
                </button>
            `;

            document.body.appendChild(container);

            let html5Qrcode = null;
            let scanInterval = null;

            const cleanup = () => {
                if (html5Qrcode) {
                    html5Qrcode.stop().catch(() => {});
                    html5Qrcode = null;
                }
                if (scanInterval) {
                    clearInterval(scanInterval);
                    scanInterval = null;
                }
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
            };

            document.getElementById('cancel-scan').onclick = () => {
                cleanup();
                reject(new Error('用户取消扫码'));
            };

            scanInterval = setTimeout(() => {
                try {
                    html5Qrcode = new Html5Qrcode('qr-code-reader');
                    
                    html5Qrcode.start(
                        { facingMode: 'environment' },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 }
                        },
                        (decodedText) => {
                            try {
                                const data = JSON.parse(decodedText);
                                cleanup();
                                resolve(data);
                            } catch (error) {
                                alert('二维码数据格式错误');
                            }
                        },
                        (errorMessage) => {
                            // console.log('Scan error:', errorMessage);
                        }
                    ).catch((err) => {
                        cleanup();
                        reject(new Error('无法访问摄像头：' + err.message));
                    });
                } catch (error) {
                    cleanup();
                    reject(new Error('摄像头初始化失败：' + error.message));
                }
            }, 100);
        });
    },

    // 解析二维码数据
    parseQRData(data) {
        try {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            if (!data.v || data.v !== 1) {
                throw new Error('不支持的二维码版本');
            }

            if (!data.a || !data.s) {
                throw new Error('二维码数据不完整');
            }

            return {
                version: data.v,
                alias: data.a,
                sliceC: data.s
            };
        } catch (error) {
            throw new Error('二维码解析失败：' + error.message);
        }
    }
};

// ==========================================
// 暴露到全局作用域
// ==========================================
window.QRGenerator = QRGenerator;
window.QRScanner = QRScanner;
