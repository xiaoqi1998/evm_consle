# 二维码密保体系 (QR Code Backup System)

## 概述

二维码密保体系是 EVM API 控制面板的创新安全机制，通过二维码技术实现私钥分片的便捷备份和恢复。该方案完全在前端完成，确保私钥分片 never 离开您的浏览器。

## 技术架构

### 1. 数据格式

二维码包含以下 JSON 数据：

```json
{
  "v": 1,
  "a": "账户别名",
  "s": "切片 C 内容"
}
```

- `v`: 版本号（当前为 1）
- `a`: 账户别名（用于匹配账户）
- `s`: 切片 C（密码分片）

### 2. 依赖库

- **qrcode.js**: 生成二维码
- **jsQR**: PC端图片识别
- **html5-qrcode**: 手机端摄像头扫码

### 3. 核心模块

#### QRGenerator

```javascript
// 生成密保数据
QRGenerator.generateBackupData(alias, sliceC)

// 生成二维码图片 (Base64)
QRGenerator.generateQRBase64(data, size)

// 生成带水印的密保卡片
QRGenerator.generateBackupCard(alias, sliceC, accountAddress)

// 下载密保图片
QRGenerator.downloadBackupImage(alias)
```

#### QRScanner

```javascript
// PC端：上传图片识别
QRScanner.scanImageFromFile(file)

// 手机端：调用摄像头扫码
QRScanner.scanWithCamera()

// 解析二维码数据
QRScanner.parseQRData(data)
```

## 使用流程

### 备份阶段

1. **添加账户时**：系统自动生成密保二维码
2. **显示卡片**：包含二维码、账户信息和安全警告
3. **下载图片**：点击"下载密保图片"保存为 PNG 文件
4. **离线保存**：打印或存入物理加密U盘

### 恢复阶段

1. **检测缺失**：本地分片丢失时，系统提示需要恢复
2. **选择方式**：
   - PC端：上传二维码图片
   - 手机端：开启摄像头扫码
3. **解析数据**：获取切片 C
4. **同步切片**：向服务器请求切片 A
5. **本地重构**：A + C = 私钥
6. **重新分片**：生成新的分片并设置新密码

## 安全特性

### 1. 离线生成

- 二维码生成逻辑完全在前端完成
- 绝不会将切片 C 发送到服务器
- 避免服务器缓存痕迹

### 2. 防伪水印

- 二维码周围显示账户地址
- 底部显示"密保凭证"字样
- 防止用户存错图

### 3. 自动失效

- 恢复时会重新生成新的分片
- 旧的二维码将失效
- 防止二维码重复使用

## 使用场景

### 场景 1：首次备份

```
用户：输入私钥 -> 点击保存
系统：生成 A, B, C -> 弹出密保二维码卡片
用户：点击下载 -> 保存为 Account_A_Safety.png
结果：备份完成
```

### 场景 2：设备更换

```
用户：重装系统 -> 登录账号 -> 点击账户
系统：提示"需要恢复"
用户：点击"恢复"按钮 -> 上传二维码图片
系统：解析二维码 -> 同步切片 A -> 重构私钥
用户：设置新密码
结果：账户无缝激活
```

### 场景 3：浏览器清空

```
用户：清空浏览器数据 -> 登录账号
系统：检测本地分片缺失 -> 提示恢复
用户：扫码或上传图片 -> 输入新密码
结果：资产恢复
```

## 安全警告

### ⚠️ 重要提示

1. **唯一凭证**：这是恢复该账户的唯一凭证
2. **离线保存**：请勿存入手机相册或云端
3. **打印建议**：建议直接打印或存入物理加密U盘
4. **泄露风险**：一旦泄露，黑客可直接盗取资金

### ⚠️ 安全最佳实践

1. **多位置保存**：在多个物理位置保存二维码
2. **加密存储**：使用加密U盘或加密文件夹
3. **定期检查**：定期检查备份是否可用
4. **防止损坏**：避免二维码图片损坏或模糊

## 技术细节

### 二维码生成流程

```javascript
// 1. 生成 JSON 数据
const data = {
  v: 1,
  a: alias,
  s: sliceC
};

// 2. 生成二维码
const qrBase64 = await QRGenerator.generateQRBase64(JSON.stringify(data));

// 3. 生成卡片 HTML
const cardHTML = await QRGenerator.generateBackupCard(alias, sliceC, address);

// 4. 下载图片
QRGenerator.downloadBackupImage(alias);
```

### 二维码识别流程

```javascript
// PC端：上传图片
const file = event.target.files[0];
const qrData = await QRScanner.scanImageFromFile(file);

// 手机端：摄像头扫码
const qrData = await QRScanner.scanWithCamera();

// 解析数据
const parsed = QRScanner.parseQRData(qrData);
// 返回：{ version: 1, alias: 'xxx', sliceC: 'xxx' }
```

### 恢复流程

```javascript
// 1. 获取服务器切片 A
const accountData = await fetch(`/api/accounts/${alias}`);
const sliceA = accountData.data.pk_slice_server;

// 2. 合并切片：A + C = 私钥
const privateKey = Shamir.combine([sliceA, sliceC]);

// 3. 重新生成分片
const newSlices = Shamir.share(cleanPrivateKey, 3, 2);

// 4. 更新服务器切片 A
await fetch(`/api/accounts/${alias}`, {
  method: 'PUT',
  body: JSON.stringify({ pk_slice_server: newSliceA })
});

// 5. 加密保存本地切片 B
await SecureStorage.saveEncryptedSlice(alias, newSliceB, password);
```

## 常见问题

### Q: 二维码可以重复使用吗？

A: 不可以。恢复时会重新生成新的分片，旧的二维码将失效。

### Q: 二维码泄露了怎么办？

A: 立即使用该二维码恢复账户，然后重新生成新的密保二维码。

### Q: 可以将二维码存入云端吗？

A: 不建议。如果必须存入云端，请使用加密存储。

### Q: 二维码图片损坏了怎么办？

A: 如果有其他备份位置的副本，可以使用副本恢复。如果没有，资产将无法恢复。

### Q: 支持哪些浏览器？

A: 支持所有现代浏览器（Chrome, Firefox, Edge, Safari），需要支持摄像头和 Canvas API。

## 开发者指南

### 添加依赖

```html
<!-- QR Code Generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<!-- PC端图片识别 -->
<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
<!-- 手机端扫码 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>
<!-- 二维码工具模块 -->
<script src="/static/js/qrcode-utils.js"></script>
```

### 使用示例

```javascript
// 生成备份
const cardHTML = await QRGenerator.generateBackupCard('myAccount', '3-abc...', '0x...');
document.getElementById('backup-container').innerHTML = cardHTML;

// 下载图片
QRGenerator.downloadBackupImage('myAccount');

// 扫码恢复
const qrData = await QRScanner.scanWithCamera();
const parsed = QRScanner.parseQRData(qrData);
console.log(parsed.alias, parsed.sliceC);
```

## 更新日志

### v1.0.0 (2026-03-17)

- ✅ 实现二维码生成和下载功能
- ✅ 实现 PC端图片识别
- ✅ 实现手机端摄像头扫码
- ✅ 实现账户恢复流程
- ✅ 添加完整的中英文文案支持
- ✅ 添加安全警告和提示

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
