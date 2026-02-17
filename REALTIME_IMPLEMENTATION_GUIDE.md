# Real-Time Audio Streaming Implementation Guide

## 📋 完成情况总结

### ✅ 已实现的功能

#### 1. **后端 WebSocket 基础设施**
- ✅ Socket.io 集成到 Express 服务器
- ✅ JWT 认证中间件
- ✅ 事件处理器（socket/handlers.ts）
- ✅ CORS 配置用于跨域 WebSocket 连接

**文件位置：**
- [backend/src/index.ts](../backend/src/index.ts) - Socket.io 初始化
- [backend/src/socket/handlers.ts](../backend/src/socket/handlers.ts) - 事件处理

#### 2. **SessionManager - 会话编排器**
核心业务逻辑类，负责：
- ✅ 创建和管理实时会话
- ✅ 音频缓冲和分块处理
- ✅ 自动会话超时管理（30分钟）
- ✅ 内存监控和清理

**核心特性：**
```typescript
// 音频缓冲管理
- 音频块大小限制：32KB (~2 seconds at 16kHz)
- 自动分块超时：2秒无新数据触发处理
- 实时会话清理：60秒检查一次过期会话
```

**文件位置：**
- [backend/src/services/sessionManager.ts](../backend/src/services/sessionManager.ts)

#### 3. **前端 WebSocket 客户端**
- ✅ Socket.io-client 集成
- ✅ 自动重连机制（指数退避）
- ✅ Token-based 认证

**文件位置：**
- [frontend/src/lib/socketClient.ts](../frontend/src/lib/socketClient.ts)

#### 4. **前端音频录制**
使用 MediaRecorder API：
- ✅ 麦克风权限处理
- ✅ 音频分块输出（每250ms）
- ✅ 实时音量监控
- ✅ 噪音抑制和回声消除
- ✅ 自动错误处理

**文件位置：**
- [frontend/src/hooks/useAudioRecorder.ts](../frontend/src/hooks/useAudioRecorder.ts)

**配置：**
```typescript
- 采样率：16kHz
- 声道：单声道
- 格式：WebM/Opus
- 分块间隔：250ms
```

#### 5. **实时 Roleplay 钩子**
完整的会话管理钩子：
- ✅ 连接/断开连接
- ✅ 录音启动/停止
- ✅ 实时状态同步
- ✅ 错误处理

**文件位置：**
- [frontend/src/hooks/useRealtimeRoleplay.ts](../frontend/src/hooks/useRealtimeRoleplay.ts)

**状态管理：**
```typescript
interface RealtimeSessionState {
  sessionId: string | null;
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  currentTranscription: string;
  aiResponse: string;
  turnCount: number;
  maxTurns: number;
  error: string | null;
  conversationHistory: Array<{ role: 'user' | 'ai'; text: string; timestamp: number }>;
}
```

#### 6. **Aliyun STT 服务**
集成了阿里云 Speech-to-Text API：
- ✅ 令牌管理和刷新
- ✅ OSS 音频上传（占位符）
- ✅ 实时转录 API 调用
- ✅ 错误处理和重试机制

**文件位置：**
- [backend/src/services/aliyunSTTService.ts](../backend/src/services/aliyunSTTService.ts)

**支持的语言：**
- 中文（简体）：zh-CN
- 中文（繁体）：zh-TW
- 英文：en-US
- 等等...

---

## 🔧 环境配置

### 后端 (.env)

```bash
# Aliyun 凭证
ALIYUN_ACCESS_KEY_ID=your_key_id
ALIYUN_ACCESS_KEY_SECRET=your_key_secret
ALIYUN_REGION_ID=cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name

# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# AI 服务（现有）
AI_API_KEY=your_ai_api_key
```

### 前端 (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📡 WebSocket 事件流程

### 1. 连接建立
```
客户端 → ['start-session', { sessionId, scenarioId }]
服务器 → ['session-started', { maxTurns, buyerPersona, audioConfig }]
```

### 2. 音频流处理
```
客户端 → ['audio-chunk', { sessionId, audioData (base64), offset, totalChunks }]
服务器 → ['audio-received', { audioSize, timestamp }]
        ↓
      [STT 处理中]
服务器 → ['transcription', { text, timestamp }]
```

### 3. AI 回复流程
```
服务器 → ['ai-response', { text, turnCount, maxTurns, timestamp }]
        ↓
      [生成头像响应中]
服务器 → ['avatar-response', { videoUrl, audioUrl, duration }]
```

### 4. 会话结束
```
客户端 → ['end-session', { sessionId }]
服务器 → ['session-ended', { reason, totalTurns, duration }]
```

---

## 💻 使用示例

### 前端组件示例

```typescript
'use client';

import { useRealtimeRoleplay } from '@/hooks/useRealtimeRoleplay';
import { useState } from 'react';

export default function RealtimeRoleplayPage() {
  const {
    sessionId,
    isConnected,
    isRecording,
    isProcessing,
    currentTranscription,
    aiResponse,
    turnCount,
    maxTurns,
    error,
    volume,
    conversationHistory,
    connectSession,
    startRecording,
    stopRecording,
    endSession,
  } = useRealtimeRoleplay({
    sessionId: 'session-123', // 从服务器获取
    scenarioId: 'scenario-456', // 从服务器获取
    chunkInterval: 250,
  });

  const handleStart = async () => {
    try {
      await connectSession();
      await startRecording();
    } catch (err) {
      console.error('Failed to start:', err);
    }
  };

  const handleStop = async () => {
    await stopRecording();
    await endSession();
  };

  return (
    <div className="p-4">
      <div>连接状态: {isConnected ? '✓' : '✗'}</div>
      <div>录音中: {isRecording ? '是' : '否'}</div>
      <div>音量: {Math.round(volume * 100)}%</div>
      <div>当前转录: {currentTranscription}</div>
      <div>AI 回复: {aiResponse}</div>
      <div>轮数: {turnCount}/{maxTurns}</div>
      {error && <div className="text-red-500">错误: {error}</div>}
      
      <button onClick={handleStart} disabled={isRecording}>
        开始
      </button>
      <button onClick={handleStop} disabled={!isRecording}>
        结束
      </button>

      <div className="mt-4">
        <h3>对话历史</h3>
        {conversationHistory.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}>
            <strong>{msg.role}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🚀 后续需要实现的功能

### 1. **头像视频生成** (Priority: High)
需要选择方案：
- [ ] **ElevenLabs** - TTS 生成音频
- [ ] **D-ID** - 数字头像视频生成
- [ ] **阿里云 AI** - 集成阿里云 TTS 和视频服务
- [ ] **本地方案** - 预录制视频播放

**建议方案：** 结合 Aliyun TTS（文字转语音）+ 预录制头像视频同步

### 2. **Aliyun OSS 集成** (Priority: High)
```typescript
// 需要实现：
1. 音频上传到 OSS
2. OSS URL 生成（有签名的 URL）
3. 视频/音频流式输出
4. 清理过期文件
```

**所需 NPM 包：**
```bash
npm install @alicloud/oss-sdk-js
```

### 3. **音频格式转换** (Priority: Medium)
```typescript
// WebM → PCM/WAV 转换（如果 Aliyun STT 需要特定格式）
// 建议包：ffmpeg.js 或 node-ffmpeg
```

### 4. **数据库扩展** (Priority: Medium)
```prisma
// 添加新模型用于存储实时会话数据
model RealtimeSession {
  id String @id @default(uuid())
  sessionId String @unique
  userId String
  user User @relation(fields: [userId], references: [id])
  audioMetadata Json? // 采样率、格式等
  transcriptionResults Json[] // 中间结果
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 5. **性能优化** (Priority: High)
- [ ] 音频压缩
- [ ] 连接池管理
- [ ] 消息队列（用于高并发）
- [ ] 缓存策略

### 6. **监控和日志** (Priority: Medium)
- [ ] WebSocket 连接指标
- [ ] STT 处理时间
- [ ] 错误率追踪
- [ ] 用户会话统计

---

## 🔍 测试清单

### 后端测试
- [ ] Socket.io 连接建立
- [ ] JWT 认证验证
- [ ] 音频分块处理
- [ ] STT API 调用
- [ ] AI 回复生成
- [ ] 会话超时清理

### 前端测试
- [ ] MediaRecorder 初始化
- [ ] 麦克风权限请求
- [ ] 音频分块发送
- [ ] WebSocket 消息接收
- [ ] 错误恢复和重连

### 集成测试
- [ ] 完整会话流程
- [ ] 多个并发会话
- [ ] 网络中断恢复
- [ ] 大文件音频处理

---

## 📊 架构图

```
┌─────────────────────────┐
│    前端 (Next.js)        │
│  ┌────────────────────┐  │
│  │ useRealtimeRoleplay│  │
│  │ - 连接管理         │  │
│  │ - 音频录制         │  │
│  │ - 状态同步         │  │
│  └────────────────────┘  │
│           ↕              │
│  ┌────────────────────┐  │
│  │ useAudioRecorder   │  │
│  │ - MediaRecorder    │  │
│  │ - 分块处理         │  │
│  └────────────────────┘  │
│           ↕              │
│  ┌────────────────────┐  │
│  │ socketClient       │  │
│  │ - WebSocket 连接   │  │
│  └────────────────────┘  │
└──────────────┬────────────┘
               │ WebSocket (ws://)
               │ 事件: audio-chunk, transcription, ai-response
               ↓
┌─────────────────────────┐
│   后端 (Node.js)        │
│  ┌────────────────────┐  │
│  │ Socket.io Handler  │  │
│  │ - 认证             │  │
│  │ - 事件分发         │  │
│  └────────────────────┘  │
│           ↕              │
│  ┌────────────────────┐  │
│  │ SessionManager     │  │
│  │ - 会话编排         │  │
│  │ - 音频缓冲         │  │
│  │ - 流程控制         │  │
│  └────────────────────┘  │
│           ↕              │
│  ┌────────────────────┐  │
│  │ aliyunSTTService   │  │
│  │ - 语音识别         │  │
│  └────────────────────┘  │
│           ↕              │
│  ┌────────────────────┐  │
│  │ aiService          │  │
│  │ - AI 对话          │  │
│  └────────────────────┘  │
└─────────────────────────┘
```

---

## 🐛 已知问题和注意事项

1. **Aliyun STT 占位符**
   - `aliyunSTTService.transcribeAudio()` 需要实现 OSS 上传
   - 目前返回空字符串作为占位符
   - 需要添加 @alicloud/oss-sdk-js 依赖

2. **头像生成**
   - 目前 `generateAvatarResponse()` 是占位符
   - 返回模拟 URL，实际需要实现

3. **错误恢复**
   - WebSocket 自动重连已实现
   - 但需要处理部分发送的音频块

4. **并发限制**
   - 当前实现支持多个会话
   - 高并发下可能需要使用消息队列

---

## 📚 相关文档

- [Aliyun Speech Recognition API](https://help.aliyun.com/document_detail/197292.html)
- [Socket.io 文档](https://socket.io/docs/v4/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [WebSocket 最佳实践](https://www.rfc-editor.org/rfc/rfc6455)

---

## 🎯 下一步行动

1. **配置 Aliyun 凭证**
   - 创建 AccessKey
   - 设置环境变量

2. **实现 Aliyun OSS 集成**
   - 安装 @alicloud/oss-sdk-js
   - 实现 `uploadAudioToOSS()` 方法

3. **测试完整流程**
   - 启动后端：`npm run dev`
   - 启动前端：`npm run dev`
   - 测试录音和转录

4. **实现头像视频生成**
   - 选择生成方案
   - 集成 API
   - 测试视频播放

---

## 📝 配置检查清单

- [ ] Aliyun AccessKey 已配置
- [ ] OSS 存储桶已创建
- [ ] 前端 .env.local 已配置
- [ ] Socket.io 端口未被占用
- [ ] CORS 域名配置正确
- [ ] JWT Secret 已设置
