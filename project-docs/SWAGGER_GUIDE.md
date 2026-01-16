# Swagger/OpenAPI 集成指南

## 已完成的设置

✅ 已在项目中集成 Swagger UI
✅ 文章路由已添加完整的 Swagger 文档

## 访问 Swagger UI

启动服务器后，访问以下地址：

```
http://localhost:PORT/api-docs
```

其中 `PORT` 是你的服务器端口（通常是 3001 或其他配置的端口）

## 为其他路由添加 Swagger 文档

### 1. 在路由文件中添加 JSDoc 注释

每个 API 端点都需要在对应的路由定义前添加 `@swagger` 注释块。

**示例格式：**

```typescript
/**
 * @swagger
 * /path/to/endpoint:
 *   get:
 *     summary: 操作说明
 *     tags:
 *       - 标签名
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: 参数描述
 *     responses:
 *       200:
 *         description: 成功响应描述
 *       401:
 *         description: 未授权
 */
router.get('/path/to/endpoint', handler);
```

### 2. 常见的 Swagger 注释模式

#### GET 请求示例
```typescript
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: 获取用户信息
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 用户数据
 *       404:
 *         description: 用户不存在
 */
```

#### POST 请求示例
```typescript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: 创建新用户
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       201:
 *         description: 用户创建成功
 *       400:
 *         description: 请求参数无效
 */
```

#### PUT/PATCH 请求示例
```typescript
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
```

#### DELETE 请求示例
```typescript
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: 删除用户
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 用户不存在
 */
```

### 3. 参数类型

#### Query 参数
```typescript
parameters:
  - in: query
    name: page
    schema:
      type: number
      default: 1
    description: 页码
```

#### Path 参数
```typescript
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: string
    description: 资源ID
```

#### Header 参数
```typescript
parameters:
  - in: header
    name: X-Custom-Header
    schema:
      type: string
    description: 自定义头
```

### 4. 数据类型

常见的数据类型：
- `string` - 字符串
- `number` - 数字
- `integer` - 整数
- `boolean` - 布尔值
- `array` - 数组
- `object` - 对象

### 5. 安全性定义

对于需要 JWT 认证的端点，添加：

```typescript
security:
  - bearerAuth: []
```

对于公开端点，使用空的 security 数组或不包含 security 字段。

### 6. 测试 API

Swagger UI 提供了一个内置的测试工具：

1. 打开 `http://localhost:PORT/api-docs`
2. 找到要测试的 API
3. 点击 "Try it out" 按钮
4. 填写必要的参数
5. 点击 "Execute" 执行请求
6. 查看响应结果

## 需要为以下路由添加 Swagger 文档

根据你的项目结构，还需要为以下路由添加文档：

- [ ] `/backend/src/routes/admin.ts`
- [ ] `/backend/src/routes/auth.ts`
- [ ] `/backend/src/routes/email.ts`
- [ ] `/backend/src/routes/feedback.ts`
- [ ] `/backend/src/routes/notifications.ts`
- [ ] `/backend/src/routes/orders.ts`
- [ ] `/backend/src/routes/roleplay.ts`
- [ ] `/backend/src/routes/scenarios.ts`
- [ ] `/backend/src/routes/statistics.ts`
- [ ] `/backend/src/routes/system.ts`

## 常用标签建议

为了保持文档的组织性，建议使用以下标签：

```typescript
tags:
  - Articles        // 文章管理
  - Categories      // 分类管理
  - Users           // 用户管理
  - Authentication  // 认证
  - Admin           // 管理员功能
  - Notifications   // 通知
  - Orders          // 订单
  - Feedback        // 反馈
  - Scenarios       // 场景
  - Roleplay        // 角色扮演
```

## 配置文件位置

- Swagger 配置: [src/config/swagger.ts](../backend/src/config/swagger.ts)
- 主应用文件: [src/app.ts](../backend/src/app.ts)

## 生成 OpenAPI JSON

如果需要导出 OpenAPI JSON 文件，可以访问：

```
http://localhost:PORT/api-docs/swagger.json
```

这个 JSON 文件可以用于：
- 导入到其他 API 工具（如 Postman、Insomnia）
- 生成客户端代码
- 与其他系统集成
