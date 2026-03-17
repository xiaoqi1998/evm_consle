# 二维码恢复功能 - PUT 路由补全

## 问题描述

用户点击"恢复"按钮时，前端发送 PUT 请求更新服务器切片，但后端没有实现 PUT 方法，导致返回 405 Method Not Allowed 错误。

## 解决方案

在后端添加 PUT 方法支持，用于更新账户信息（特别是服务器存储的私钥分片）。

## 修改内容

### 后端修改 (config_bp.py)

**文件**: `c:\Users\SNQU-0245\Downloads\evm_api_flask\config_bp.py`

**位置**: 在 `/api/accounts/<alias>` 的 POST 和 DELETE 路由之间

**新增代码**:

```python
@config_bp.route('/api/accounts/<alias>', methods=['PUT'])
@login_required_or_token
def update_account(alias):
    """
    更新账户信息
    ---    
    tags:
      - 账户管理
    security:
      - api_key: []
    parameters:
      - name: alias
        in: path
        required: true
        type: string
        description: 账户别名
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            address:
              type: string
              description: 账户地址
            pk_slice_server:
              type: string
              description: 服务器存储的私钥分片
    responses:
      200:
        description: 更新账户成功
      400:
        description: 参数错误
      404:
        description: 账户未找到
      401:
        description: 未授权
    """
    data = request.json
    address = data.get('address')
    pk_slice_server = data.get('pk_slice_server')
    
    username = g.user_username
    user = User.query.filter_by(username=username).first()
    
    if user:
        acc = Account.query.filter_by(user_id=user.id, alias=alias).first()
        if not acc:
            return create_response(error="AccountNotFound", details=f"Account alias '{alias}' not found.", status_code=404)
        
        # 更新地址（如果提供）
        if address is not None:
            acc.address = address
        
        # 更新服务器分片（如果提供）
        if pk_slice_server is not None:
            acc.pk_slice_server = pk_slice_server
        
        db.session.commit()
        return create_response(message="Account updated successfully")
    return create_response(message="User not found", status_code=404)
```

### 前端代码 (index.js)

**文件**: `c:\Users\SNQU-0245\Downloads\evm_api_flask\static\index.js`

**位置**: `restoreAccountWithQR` 函数中

**代码**:

```javascript
// 4. 更新服务器切片 A
const updateRes = await fetch(`/api/accounts/${alias}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pk_slice_server: newSliceA })
});

if (!updateRes.ok) {
    throw new Error('更新服务器切片失败');
}
```

## API 规范

### PUT /api/accounts/<alias>

**功能**: 更新指定账户的信息

**认证**: 需要登录或有效的 API Token

**请求体**:
```json
{
  "address": "0x123...",      // 可选：更新账户地址
  "pk_slice_server": "1-abc..."  // 可选：更新服务器存储的私钥分片
}
```

**响应**:

成功 (200):
```json
{
  "status": "success",
  "message": "Account updated successfully"
}
```

账户不存在 (404):
```json
{
  "status": "error",
  "error": "AccountNotFound",
  "details": "Account alias 'xxx' not found."
}
```

## 使用场景

### 二维码恢复流程

1. 用户扫码获取切片 C
2. 从服务器获取切片 A
3. 合并 A + C 还原私钥
4. **重新生成分片** (A', B', C')
5. **PUT 更新服务器切片 A'** ← 本功能
6. 保存本地分片 B' (加密)
7. 提示用户设置新密码

### 其他可能的用途

- 更新账户地址
- 更新服务器存储的私钥分片
- 批量更新账户信息

## 安全考虑

1. **认证保护**: 使用 `@login_required_or_token` 装饰器
2. **权限验证**: 只允许用户更新自己的账户
3. **参数验证**: 可选参数，只更新提供的字段
4. **数据库事务**: 使用 `db.session.commit()` 确保数据一致性

## 测试

### 测试方法

```bash
# 测试 PUT 请求
curl -X PUT http://localhost:5002/api/accounts/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"pk_slice_server": "1-new-slice..."}'
```

### 预期结果

- 成功: 返回 200，消息 "Account updated successfully"
- 未认证: 返回 401
- 账户不存在: 返回 404

## 注意事项

1. 地址和分片都是可选参数，可以单独更新其中一个
2. 如果不提供参数，会返回成功但不更新任何内容
3. 更新成功后，旧的二维码将失效（因为分片已改变）
4. 建议在恢复完成后，重新生成新的密保二维码

## 相关文件

- 后端路由: `config_bp.py`
- 前端调用: `index.js` (restoreAccountWithQR 函数)
- 数据模型: `models.py` (Account 模型)

## 版本历史

- v1.1.0 (2026-03-17): 添加 PUT 方法支持，用于二维码恢复功能
