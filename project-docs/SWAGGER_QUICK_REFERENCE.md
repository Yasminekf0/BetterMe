# Swagger API 文档快速参考

## 🎯 快速开始

1. **启动服务器**
   ```bash
   cd backend
   npm run dev
   ```

2. **访问 Swagger UI**
   ```
   http://localhost:3001/api-docs
   ```
   (端口号根据你的配置调整)

3. **导出 OpenAPI JSON**
   ```
   http://localhost:3001/api-docs/swagger.json
   ```

---

## 📝 为新端点添加 Swagger 文档

### 最小示例
```typescript
/**
 * @swagger
 * /api/path:
 *   get:
 *     summary: 简短描述
 *     tags:
 *       - TagName
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/path', handler);
```

### 带参数示例
```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取用户
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/users/:id', handler);
```

### 带请求体示例
```typescript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建用户
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/users', handler);
```

### 需要认证示例
```typescript
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 获取所有用户
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 *       401:
 *         description: 未授权
 */
router.get('/admin/users', authenticate, handler);
```

---

## 🏷️ 推荐的标签分类

组织你的 API 端点，使用清晰的标签：

| 标签 | 用途 |
|------|------|
| Articles | 文章管理 |
| Categories | 分类管理 |
| Users | 用户管理 |
| Authentication | 认证相关 |
| Admin | 管理员功能 |
| Orders | 订单管理 |
| Feedback | 用户反馈 |
| Notifications | 通知系统 |
| Roleplay | 角色扮演 |
| Scenarios | 场景管理 |

---

## 🔐 认证配置

Swagger UI 中已配置 JWT Bearer Token 认证。使用方式：

1. 在 Swagger UI 右上角点击 🔒 按钮
2. 输入你的 JWT token（格式：`Bearer <your-token>`）
3. 所有标记为 `security: bearerAuth` 的请求都会自动附加认证头

---

## 📚 参数类型速查表

### Query 参数
```typescript
parameters:
  - in: query
    name: page
    schema:
      type: number
```

### Path 参数
```typescript
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: string
```

### 数据类型
- `string` - 字符串
- `number` - 浮点数
- `integer` - 整数
- `boolean` - 布尔值
- `array` - 数组
- `object` - 对象

---

## ✨ 已完成的工作

✅ **Articles 路由** - 完整的 Swagger 文档
- 文章 CRUD 操作
- 分类管理
- 发布/取消发布
- 统计信息
- 公开端点

---

## 📋 待办事项

以下路由还需要添加 Swagger 文档：

- [ ] Admin 路由
- [ ] Authentication 路由
- [ ] Email 路由
- [ ] Feedback 路由
- [ ] Notifications 路由
- [ ] Orders 路由
- [ ] Roleplay 路由
- [ ] Scenarios 路由
- [ ] Statistics 路由
- [ ] System 路由

---

## 🛠️ 文件位置

```
backend/
├── src/
│   ├── app.ts                    ← Swagger UI 集成点
│   ├── config/
│   │   └── swagger.ts            ← Swagger 配置
│   ├── routes/
│   │   ├── articles.ts           ✅ 已完成
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   └── ...
│   └── controllers/
├── package.json                  ← 已添加类型定义
└── ...
```

---

## 🚀 实用 CLI 命令

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 运行数据库迁移
npm run db:migrate

# 打开 Prisma Studio
npm run db:studio
```

---

## 💡 技巧与最佳实践

1. **保持描述简洁** - 使用 `summary` 字段提供清晰的功能说明
2. **使用适当的 HTTP 状态码** - 200、201、400、404、500 等
3. **为每个端点分配标签** - 便于在 UI 中分组显示
4. **文档与代码同步** - 修改 API 时同时更新 Swagger 文档
5. **使用 `example` 字段** - 在 schema 中提供示例值

---

## 📖 参考资源

- [Swagger/OpenAPI 规范](https://swagger.io/specification/)
- [swagger-jsdoc 文档](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express 文档](https://github.com/scottie1984/swagger-ui-express)
