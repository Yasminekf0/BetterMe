# Master Trainer Bug日志记录

---

## 文档说明

本文档用于记录项目开发过程中发现的所有Bug和问题，以及对应的解决方案。

---

## Bug记录模板

```
### Bug-[编号]: [简短标题]

**发现日期**: YYYY-MM-DD
**严重程度**: 紧急/高/中/低
**状态**: 待处理/处理中/已解决/已关闭

**问题描述**:
[详细描述问题现象]

**复现步骤**:
1. 步骤1
2. 步骤2
3. ...

**期望行为**:
[描述期望的正确行为]

**实际行为**:
[描述实际发生的错误行为]

**环境信息**:
- 浏览器: 
- 操作系统:
- 页面/功能模块:

**错误日志**:
```
[相关错误日志]
```

**解决方案**:
[描述解决方案]

**修复文件**:
- `path/to/file.ts`

**修复日期**: YYYY-MM-DD
**修复人**: [姓名]
```

---

## Bug列表

### Bug-001: AI模型连接测试失败 - OperationType.READ 未定义

**发现日期**: 2026-01-14
**严重程度**: 高
**状态**: 已解决

**问题描述**:
在管理员后台点击AI模型的连接测试按钮时，虽然AI模型连接成功，但返回500错误。

**复现步骤**:
1. 登录管理员后台
2. 进入 AI Models 管理页面
3. 点击任意模型的测试按钮（闪电图标）
4. 返回500错误

**期望行为**:
测试成功后显示连接成功消息，包含响应时间等信息。

**实际行为**:
API返回500错误，前端显示测试失败。

**环境信息**:
- 页面/功能模块: /admin/ai-models

**错误日志**:
```
prisma:error 
Invalid `prisma.operationLog.create()` invocation in
/www/wwwroot/Betterme/backend/src/services/operationLogService.ts:59:31

Argument `operationType` is missing.
```

**根本原因**:
在 `adminController.ts` 的 `testAIModel` 函数中使用了 `OperationType.READ`，但 `OperationType` 枚举中没有定义 `READ` 类型。

**解决方案**:
1. 在 `operationLogService.ts` 中的 `OperationType` 枚举添加 `READ` 和 `TEST` 类型
2. 在 `adminController.ts` 中将 `OperationType.READ` 改为 `OperationType.TEST`

**修复文件**:
- `backend/src/services/operationLogService.ts`
- `backend/src/controllers/adminController.ts`

**修复日期**: 2026-01-14
**修复人**: AI Assistant

---

### Bug-002: ERR_EMPTY_RESPONSE - 服务器无响应

**发现日期**: 2026-01-14
**严重程度**: 紧急
**状态**: 已解决

**问题描述**:
用户访问 `154.9.252.164` 时收到 `ERR_EMPTY_RESPONSE` 错误，服务器未发送任何数据。

**复现步骤**:
1. 在浏览器访问 http://154.9.252.164:3000
2. 页面显示 ERR_EMPTY_RESPONSE 错误

**期望行为**:
正常显示 Master Trainer 网站首页。

**实际行为**:
浏览器显示"未发送任何数据"错误。

**环境信息**:
- 服务器: 154.9.252.164
- 前端端口: 3000
- 后端端口: 3001

**错误日志**:
```
2026-01-14 12:04:09 [ERROR]: Uncaught Exception {"error":"listen EADDRINUSE: address already in use :::3001"}
2026-01-14 12:18:34 [ERROR]: Uncaught Exception {"error":"listen EADDRINUSE: address already in use 0.0.0.0:3001"}
```

**根本原因**:
1. 后端服务崩溃后端口被僵尸进程占用
2. 前端服务未运行
3. 多次尝试重启服务导致端口冲突

**解决方案**:
1. 使用 `kill -9 15998` 杀死占用端口3001的僵尸进程
2. 重新启动后端服务: `cd /www/wwwroot/Betterme/backend && npm run dev`
3. 重新启动前端服务: `cd /www/wwwroot/Betterme/frontend && npm run dev`
4. 验证服务正常响应

**修复文件**:
- 无代码修改，仅服务重启

**修复日期**: 2026-01-14
**修复人**: AI Assistant

---

### Bug-003: 登录时返回500错误 - 后端服务未运行

**发现日期**: 2026-01-14
**严重程度**: 紧急
**状态**: 已解决

**问题描述**:
用户访问 `http://154.9.252.164:3000/login` 输入账号 `demo@mastertrainer.com` 和密码 `demo123` 后，提示 `Request failed with status code 500`。

**复现步骤**:
1. 访问 http://154.9.252.164:3000/login
2. 输入邮箱: demo@mastertrainer.com
3. 输入密码: demo123
4. 点击 Sign In 按钮
5. 返回500错误

**期望行为**:
成功登录并跳转到Dashboard页面。

**实际行为**:
API返回500错误，控制台显示多个API请求失败：
- `/api/auth/me` - 500 (Internal Server Error)
- `/api/roleplay/history` - 500 (Internal Server Error)
- `/api/scenarios/recommended` - 500 (Internal Server Error)
- `/api/statistics/user` - 500 (Internal Server Error)

**环境信息**:
- 浏览器: Chrome
- 服务器: 154.9.252.164
- 前端端口: 3000
- 后端端口: 3001

**错误日志**:
```
前端控制台:
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://154.9.252.164:3000/api/auth/me

后端日志:
无新日志记录（后端服务未运行）
```

**根本原因**:
1. 后端服务（端口3001）没有在运行
2. 前端服务虽然在运行，但API代理目标不可达
3. 有多个僵尸进程占用端口导致新服务无法正常启动
4. 之前的前端实例在错误的端口（3002）运行

**解决方案**:
1. 清理所有相关的僵尸进程：
   ```bash
   pkill -f "backend/node_modules/.bin/ts-node-dev"
   fuser -k 3000/tcp
   fuser -k 3002/tcp
   ```
2. 重新启动后端服务（端口3001）：
   ```bash
   cd /www/wwwroot/Betterme/backend && npm run dev
   ```
3. 重新启动前端服务（端口3000）：
   ```bash
   cd /www/wwwroot/Betterme/frontend && npm run dev -- -H 0.0.0.0 -p 3000
   ```
4. 验证服务正常运行并测试登录功能

**验证结果**:
- 使用curl直接测试后端API成功：
  ```bash
  curl -X POST http://127.0.0.1:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"demo@mastertrainer.com","password":"demo123"}'
  # 返回成功登录响应
  ```
- 前端登录后成功跳转到Dashboard，显示 "Good evening, Demo! 👋"

**修复文件**:
- 无代码修改，仅服务重启

**修复日期**: 2026-01-14
**修复人**: AI Assistant

---

## 统计信息

| 状态 | 数量 |
|------|------|
| 待处理 | 0 |
| 处理中 | 0 |
| 已解决 | 3 |
| 已关闭 | 0 |
| **总计** | **3** |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-01-12 | 创建文档 | 系统 |
| 2026-01-14 | 记录并修复Bug-001: AI模型连接测试失败 | AI Assistant |
| 2026-01-14 | 记录并修复Bug-002: ERR_EMPTY_RESPONSE服务器无响应 | AI Assistant |
| 2026-01-14 | 记录并修复Bug-003: 登录时返回500错误 | AI Assistant |

---

*最后更新：2026-01-14*

