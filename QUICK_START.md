# 🚀 Real-Time Audio Streaming - 快速启动指南

## 已完成的工作 ✅

### 1. **后端基础设施**
✅ Socket.io 集成（port 3001）
✅ WebSocket 事件处理器
✅ SessionManager 核心类
✅ Aliyun STT 服务（框架）
✅ 自动会话管理和超时处理

### 2. **前端集成**
✅ Socket.io 客户端
✅ MediaRecorder 音频录制钩子
✅ 实时 Roleplay 管理钩子
✅ 完整的状态管理

### 3. **文件结构**

```
后端:
├── src/
│   ├── index.ts                    # ✅ Socket.io 初始化
│   ├── socket/
│   │   └── handlers.ts             # ✅ 事件处理
│   └── services/
│       ├── sessionManager.ts       # ✅ 会话编排器
│       └── aliyunSTTService.ts     # ✅ 语音识别服务

前端:
├── src/
│   ├── lib/
│   │   ├── socketClient.ts         # ✅ WebSocket 客户端
│   │   └── logger.ts               # ✅ 日志工具
│   └── hooks/
│       ├── useAudioRecorder.ts     # ✅ 音频录制
│       └── useRealtimeRoleplay.ts  # ✅ 实时会话管理
```

---

## 🔧 配置步骤

### 步骤 1：配置阿里云凭证

编辑 `backend/.env`：

```bash
# 阿里云 Speech-to-Text
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_REGION_ID=cn-hangzhou
ALIYUN_OSS_BUCKET=your-oss-bucket

# 现有配置保持不变
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 步骤 2：创建阿里云 OSS 存储桶

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建新的 Bucket（例如：`master-trainer-audio`）
3. 配置跨域资源共享 (CORS)：
   - 允许来源：`http://localhost:3000`, `http://localhost:3001`
   - 允许方法：GET, POST, PUT
4. 获取 Bucket 名称并填入 `.env`

### 步骤 3：安装前端依赖

```bash
cd frontend
npm install
```

### 步骤 4：验证编译

```bash
# 后端编译检查
cd backend
npm run build

# 前端编译检查
cd frontend
npm run build
```

---

## 🎮 运行应用

### 终端 1 - 后端服务

```bash
cd backend
npm run dev

# 输出应该显示：
# Server started with Socket.io
# port: 3001
# socketIOEnabled: true
```

### 终端 2 - 前端应用

```bash
cd frontend
npm run dev

# 访问：http://localhost:3000
```

---

## 📡 测试流程

### 1. 检查 WebSocket 连接

在浏览器控制台：

```javascript
// 检查 Socket.io 客户端是否可用
import { socketClient } from '@/lib/socketClient';

// 连接
await socketClient.connect();
console.log('Connected:', socketClient.isConnected()); // true
```

### 2. 测试音频录制

```javascript
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const recorder = useAudioRecorder({
  sampleRate: 16000,
  onChunk: (data) => console.log('Audio chunk:', data.length),
  onError: (err) => console.error('Error:', err),
});

await recorder.startRecording();
// 等待 30 秒
await recorder.stopRecording();
```

### 3. 测试完整会话

创建测试组件 `pages/test-realtime.tsx`：

```typescript
'use client';

import { useRealtimeRoleplay } from '@/hooks/useRealtimeRoleplay';
import { useEffect, useState } from 'react';

export default function TestRealtime() {
  const [sessionId] = useState('test-session-123');
  
  const {
    isConnected,
    isRecording,
    currentTranscription,
    aiResponse,
    error,
    connectSession,
    startRecording,
    stopRecording,
    endSession,
  } = useRealtimeRoleplay({
    sessionId,
    scenarioId: 'test-scenario',
  });

  const handleStart = async () => {
    try {
      await connectSession();
      await startRecording();
    } catch (err) {
      console.error('Start failed:', err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Real-time Roleplay Test</h1>
      
      <div className="space-y-2 mb-4">
        <p>状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</p>
        <p>录音中: {isRecording ? '✅ 是' : '❌ 否'}</p>
        {error && <p className="text-red-500">错误: {error}</p>}
      </div>

      <div className="space-y-2 mb-4">
        <p><strong>转录文本:</strong> {currentTranscription}</p>
        <p><strong>AI 回复:</strong> {aiResponse}</p>
      </div>

      <div className="space-x-2">
        <button
          onClick={handleStart}
          disabled={isRecording}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          开始
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          停止录音
        </button>
        <button
          onClick={endSession}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          结束会话
        </button>
      </div>
    </div>
  );
}
```

---

## 🔍 故障排查

### 问题 1：WebSocket 连接失败

**症状:** 浏览器控制台出现 `Connection error`

**解决方案：**
```bash
# 1. 检查后端是否运行在 3001 端口
netstat -an | grep 3001

# 2. 检查后端日志是否显示 Socket.io enabled
# 3. 检查前端 CORS 配置
# 4. 确保 token 存在
localStorage.getItem('token')
```

### 问题 2：音频录制失败

**症状:** `Permission denied` 或 `NotAllowedError`

**解决方案：**
```javascript
// 检查麦克风权限
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('麦克风已授予'))
  .catch(err => console.error('权限被拒绝:', err));
```

### 问题 3：Aliyun STT 返回空结果

**症状:** 转录文本为空

**解决方案：**
```bash
# 1. 验证 Aliyun 凭证
echo $ALIYUN_ACCESS_KEY_ID
echo $ALIYUN_ACCESS_KEY_SECRET

# 2. 检查 OSS Bucket 是否存在
# 3. 查看后端日志是否有 STT API 错误
```

---

## 📊 性能监控

### 检查活跃会话

在后端代码中添加：

```typescript
import { sessionManager } from './services/sessionManager';

// 定期检查
setInterval(() => {
  const stats = sessionManager.getStats();
  console.log('Active sessions:', stats.activeSessions);
  console.log('Total memory:', (stats.totalMemory / 1024).toFixed(2), 'KB');
}, 60000);
```

### 浏览器性能监控

```javascript
// 监控音频处理时间
const start = performance.now();
// ... 处理音频
const duration = performance.now() - start;
console.log('Audio processing took:', duration, 'ms');
```

---

## 🎯 下一步任务

### 优先级 1 - 必需 (必须完成才能生产就绪)

- [ ] **实现 Aliyun OSS 上传**
  - 文件：`backend/src/services/aliyunSTTService.ts`
  - 需要：`npm install @alicloud/oss-sdk-js`
  
- [ ] **实现头像视频生成**
  - 选择方案：ElevenLabs/D-ID/Aliyun
  - 文件：`backend/src/services/sessionManager.ts` 中的 `generateAvatarResponse()`

- [ ] **全端到端测试**
  - 音频录制 → WebSocket 传输 → STT 识别 → AI 回复 → 头像生成

### 优先级 2 - 可选但推荐

- [ ] 音频压缩（减少带宽）
- [ ] 实时日志聚合
- [ ] 性能指标收集
- [ ] 用户会话分析

### 优先级 3 - 优化

- [ ] 连接池管理
- [ ] 消息队列集成（用于高并发）
- [ ] 缓存策略
- [ ] 负载均衡

---

## 📚 关键概念

### WebSocket 事件流

```
客户端                          服务器
  │
  ├─ connect ──────────────────> 验证 JWT
  │                              │
  │ <─────── session-started ─── 返回会话信息
  │
  ├─ audio-chunk ───────────────> 缓冲音频
  │ (每 250ms 一次)              │
  │                              ├─ 积累 → 达到阈值
  │ <─────── audio-received ──── 确认收到
  │
  │                              ├─ 调用 Aliyun STT
  │ <─────── transcription ────── 返回文本
  │
  │                              ├─ 调用 AI API
  │ <─────── ai-response ──────── 返回 AI 回复
  │
  │                              ├─ 生成头像
  │ <─────── avatar-response ──── 返回视频 URL
  │
  └─ end-session ───────────────> 清理会话
```

### 音频处理流程

```
麦克风 → MediaRecorder
  ↓ (每 250ms)
Blob → Base64 编码
  ↓
WebSocket 传输
  ↓
后端缓冲
  ↓ (32KB 或 2 秒超时)
Aliyun STT
  ↓
文本结果
```

---

## 🔐 安全考虑

1. **JWT 认证** ✅ 已实现
   - 所有 WebSocket 连接需要有效 token

2. **CORS 配置** ✅ 已配置
   - 仅允许指定来源

3. **速率限制** ✅ 现有
   - Express 速率限制已启用

4. **音频数据隐私**
   - 建议在 OSS 中设置过期策略
   - 定期清理临时文件

---

## 📞 支持

### 获取帮助

1. 查看 [REALTIME_IMPLEMENTATION_GUIDE.md](./REALTIME_IMPLEMENTATION_GUIDE.md)
2. 检查后端日志：`backend/logs/`
3. 浏览器控制台错误信息
4. 网络标签页中的 WebSocket 消息

### 常用命令

```bash
# 清理日志
rm backend/logs/*

# 重启服务
pkill -f "ts-node-dev"

# 检查端口占用
lsof -i :3001

# 查看最新日志
tail -f backend/logs/*.log
```

---

**快速概览完成！现在你可以：**
1. ✅ 配置阿里云凭证
2. ✅ 启动前后端服务
3. ✅ 测试实时音频流
4. ✅ 实现剩余功能（头像生成等）
