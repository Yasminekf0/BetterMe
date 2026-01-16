# 📑 实时音频流 - 文件索引和导航

## 📚 文档

| 文档 | 用途 | 阅读时间 |
|-----|------|---------|
| [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) | ✅ 完成情况总结和检查清单 | 15 分钟 |
| [REALTIME_IMPLEMENTATION_GUIDE.md](./REALTIME_IMPLEMENTATION_GUIDE.md) | 📖 详细技术实现指南 | 30 分钟 |
| [QUICK_START.md](./QUICK_START.md) | 🚀 快速启动和配置 | 10 分钟 |
| 本文档 | 📑 文件导航和索引 | 5 分钟 |

---

## 🔧 后端文件 (`backend/src/`)

### 核心服务

#### Socket.io 初始化
📍 **[src/index.ts](./backend/src/index.ts)**
- ✅ HTTP 服务器升级为 WebSocket
- ✅ Socket.io 初始化和配置
- ✅ CORS 跨域设置
- ✅ 优雅关闭处理

**关键部分:**
```typescript
const io = new SocketIOServer(httpServer, {
  cors: { ... },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6,
});
```

#### WebSocket 事件处理
📍 **[src/socket/handlers.ts](./backend/src/socket/handlers.ts)**
- ✅ JWT 认证验证
- ✅ 连接事件处理
- ✅ 音频块接收
- ✅ 会话管理
- ✅ 错误处理

**导出的函数:**
```typescript
handleConnection() - 认证和连接
handleStartSession() - 初始化会话
handleAudioChunk() - 处理音频块
handleEndSession() - 结束会话
handleDisconnect() - 断开连接
```

#### 会话编排器 (SessionManager)
📍 **[src/services/sessionManager.ts](./backend/src/services/sessionManager.ts)**
- ✅ 会话创建和管理
- ✅ 音频缓冲处理
- ✅ STT 流程编排
- ✅ AI 回复生成
- ✅ 会话清理

**核心类方法:**
```typescript
class SessionManager {
  createSession() - 创建新会话
  getSession() - 获取活跃会话
  handleAudioChunk() - 处理音频块
  processAudioBuffer() - 处理累积音频
  generateAIResponse() - 生成 AI 回复
  endSession() - 正常结束
  forceEndSession() - 强制结束
  cleanupStaleSessions() - 清理过期会话
  getStats() - 获取统计信息
}
```

#### Aliyun STT 服务
📍 **[src/services/aliyunSTTService.ts](./backend/src/services/aliyunSTTService.ts)**
- ✅ 认证令牌管理
- ✅ STT API 集成（框架）
- ✅ OSS 上传（占位符）
- ✅ 错误处理

**待实现:**
```typescript
uploadAudioToOSS() - 需要 @alicloud/oss-sdk-js
transcribe() - 已准备好阿里云 API 调用
transcribeFromOSS() - 直接处理 OSS 文件
```

### 现有服务（保持不变）

- `src/services/aiService.ts` - AI API 集成 ✅
- `src/services/authConfigService.ts` - 认证配置 ✅
- `src/services/articleService.ts` - 文章管理 ✅
- 等等...

---

## 🎨 前端文件 (`frontend/src/`)

### 库文件 (lib/)

#### Socket.io 客户端
📍 **[src/lib/socketClient.ts](./frontend/src/lib/socketClient.ts)**
- ✅ Socket.io-client 包装
- ✅ 自动重连配置
- ✅ Token 认证
- ✅ 事件管理

**使用方式:**
```typescript
import { socketClient } from '@/lib/socketClient';

await socketClient.connect();
socketClient.emit('start-session', data);
socketClient.on('transcription', callback);
```

#### 日志工具
📍 **[src/lib/logger.ts](./frontend/src/lib/logger.ts)**
- ✅ 浏览器日志记录
- ✅ 日志级别支持
- ✅ 开发/生产环境差异

**使用方式:**
```typescript
import { logger } from '@/lib/logger';

logger.info('消息', { data });
logger.error('错误', error);
```

### 钩子 (hooks/)

#### 音频录制钩子
📍 **[src/hooks/useAudioRecorder.ts](./frontend/src/hooks/useAudioRecorder.ts)**
- ✅ MediaRecorder API 集成
- ✅ 音频分块（250ms）
- ✅ 实时音量监控
- ✅ 麦克风权限处理

**返回值:**
```typescript
{
  isRecording,    // 是否正在录音
  isMuted,        // 是否静音
  volume,         // 0-1 的音量值
  error,          // 错误对象
  startRecording(),
  stopRecording(),
  toggleMute()
}
```

#### 实时 Roleplay 钩子
📍 **[src/hooks/useRealtimeRoleplay.ts](./frontend/src/hooks/useRealtimeRoleplay.ts)**
- ✅ 完整会话管理
- ✅ WebSocket 协调
- ✅ 状态同步
- ✅ 对话历史追踪

**返回值:**
```typescript
{
  // 状态
  sessionId, isConnected, isRecording,
  currentTranscription, aiResponse,
  turnCount, maxTurns, error,
  conversationHistory, volume,
  
  // 方法
  connectSession(),
  startRecording(),
  stopRecording(),
  endSession()
}
```

---

## 🔌 配置文件

### 后端配置
📍 **[backend/.env.example.realtime](./backend/.env.example.realtime)**
- ✅ 阿里云凭证示例
- ✅ 环境变量说明

**必需配置:**
```bash
ALIYUN_ACCESS_KEY_ID=xxx
ALIYUN_ACCESS_KEY_SECRET=xxx
ALIYUN_REGION_ID=cn-hangzhou
ALIYUN_OSS_BUCKET=xxx
```

### 数据库
📍 **[backend/prisma/schema.prisma](./backend/prisma/schema.prisma)**
- 现有 Session 模型支持
- Message 模型存储对话
- 无需新增表（当前框架完整）

---

## 📊 数据流和事件

### WebSocket 事件列表

| 事件名 | 方向 | 数据 | 用途 |
|--------|------|------|------|
| `start-session` | C→S | sessionId, scenarioId | 启动实时会话 |
| `session-started` | S→C | maxTurns, buyerPersona | 会话已启动 |
| `audio-chunk` | C→S | audioData (base64) | 发送音频块 |
| `audio-received` | S→C | audioSize | 服务器确认 |
| `transcription` | S→C | text | 转录结果 |
| `ai-response` | S→C | text, turnCount | AI 回复 |
| `avatar-response` | S→C | videoUrl, audioUrl | 头像生成 |
| `end-session` | C→S | sessionId | 结束会话 |
| `session-ended` | S→C | reason, totalTurns | 会话已结束 |

---

## 🔍 快速查找指南

### 我想...

#### 修改音频设置
📍 前端: `src/hooks/useAudioRecorder.ts` (第 27-31 行)
```typescript
const audioConfig: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  format: 'pcm',
};
```

#### 修改缓冲阈值
📍 后端: `src/services/sessionManager.ts` (第 45 行)
```typescript
private MAX_AUDIO_BUFFER_SIZE = 32000; // 修改此值
```

#### 修改会话超时
📍 后端: `src/services/sessionManager.ts` (第 48-49 行)
```typescript
private SESSION_TIMEOUT = 30 * 60 * 1000; // 修改此值
```

#### 添加日志记录
📍 后端: `src/utils/logger.ts` ✅
📍 前端: `src/lib/logger.ts` ✅

#### 修改 CORS 配置
📍 后端: `src/index.ts` (第 24-28 行)
```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [/* 添加域名 */],
    // ...
  },
});
```

#### 修改认证方式
📍 后端: `src/socket/handlers.ts` (第 15-50 行)

#### 添加新事件
📍 后端: `src/socket/handlers.ts` (注册新 handler)
```typescript
socket.on('new-event', (data) => handleNewEvent(socket, data));
```

---

## 🧪 测试文件位置

### 建议创建的测试文件

```
frontend/
  ├── __tests__/
  │   ├── hooks/
  │   │   ├── useAudioRecorder.test.ts
  │   │   └── useRealtimeRoleplay.test.ts
  │   └── lib/
  │       └── socketClient.test.ts
  └── components/
      └── __examples__/
          └── RealtimeRoleplayDemo.tsx

backend/
  ├── __tests__/
  │   ├── services/
  │   │   ├── sessionManager.test.ts
  │   │   └── aliyunSTTService.test.ts
  │   └── socket/
  │       └── handlers.test.ts
```

---

## 🚀 快速命令

### 后端
```bash
cd backend

# 开发模式
npm run dev

# 编译
npm run build

# 检查类型
npx tsc --noEmit

# 启动生产
npm start
```

### 前端
```bash
cd frontend

# 开发模式
npm run dev

# 编译
npm run build

# 检查 Lint
npm run lint
```

---

## 📦 依赖关系

### 后端依赖树
```
socket.io@4.7.2
├── engine.io
├── socket.io-adapter
└── socket.io-parser

@prisma/client@5.13.0
├── (数据库)

express@4.19.2
├── (HTTP 服务器)
```

### 前端依赖树
```
socket.io-client@4.7.2
├── engine.io-client
├── socket.io-parser
└── debug

next@14.2.3
├── react@18.3.1
└── (框架)

zustand@4.5.2
└── (状态管理，可选）
```

---

## 🔐 安全检查清单

- [x] JWT 认证已实现
- [x] CORS 已配置
- [x] 速率限制已启用
- [ ] 音频数据加密 (TODO)
- [ ] OSS 文件过期策略 (TODO)
- [ ] API 密钥轮换 (TODO)

---

## 📈 性能优化建议

### 已实现
- ✅ WebSocket 持久连接
- ✅ 音频分块处理
- ✅ 缓冲管理
- ✅ 自动会话清理

### 建议添加
- [ ] 音频压缩 (可选)
- [ ] 消息队列 (高并发)
- [ ] 连接池 (性能)
- [ ] 监控指标 (可观测)

---

## 🎯 下一步

1. **立即执行**
   - [ ] 配置阿里云凭证
   - [ ] 创建 OSS Bucket
   - [ ] 实现 OSS 上传

2. **第二天**
   - [ ] 实现头像生成
   - [ ] 完整测试
   - [ ] 性能优化

3. **第三天**
   - [ ] 添加监控
   - [ ] 部署准备
   - [ ] 生产测试

---

## 🆘 常见问题快速查询

| 问题 | 解决方案 | 文件 |
|-----|--------|------|
| WebSocket 连接失败 | 检查 .env 配置 | QUICK_START.md |
| 麦克风权限问题 | 浏览器允许权限 | QUICK_START.md |
| STT 返回空结果 | 配置阿里云凭证 | REALTIME_IMPLEMENTATION_GUIDE.md |
| 性能问题 | 调整缓冲阈值 | 本文档 |
| 编译错误 | 检查 TypeScript 类型 | IMPLEMENTATION_COMPLETE.md |

---

**📝 注意:** 本文档最后更新于 2026-01-16
**版本:** 1.0 - 初始实现完成
