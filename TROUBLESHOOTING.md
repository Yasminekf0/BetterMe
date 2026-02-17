# 🐛 问题排查指南 - Real-Time Audio Streaming

## 🔍 常见问题和解决方案

### 1. WebSocket 连接问题

#### 症状 1.1: "Connection refused"

```
错误信息: Error: Connection refused on http://localhost:3001
```

**原因:**
- 后端未启动
- 端口 3001 被占用
- 防火墙阻止

**解决步骤:**
```bash
# 1. 检查后端是否运行
ps aux | grep "node"
ps aux | grep "ts-node"

# 2. 检查端口占用
lsof -i :3001
netstat -an | grep 3001

# 3. 杀死占用端口的进程（macOS/Linux）
pkill -f "ts-node"
pkill -f "node"

# 4. 重新启动后端
cd backend && npm run dev
```

#### 症状 1.2: "CORS blocked"

```
错误: Access to XMLHttpRequest blocked by CORS policy
```

**原因:**
- CORS 配置不正确
- 前端 URL 不在白名单中
- WebSocket 协议配置错误

**解决步骤:**
1. 检查 `backend/src/index.ts` 中的 CORS 配置：
```typescript
cors: {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}
```

2. 确保前端 URL 在列表中

3. 检查环境变量：
```bash
echo $FRONTEND_URL
```

#### 症状 1.3: "Connection timeout"

```
错误: WebSocket connection timeout after 60000ms
```

**原因:**
- 网络不稳定
- 服务器响应慢
- 防火墙配置

**解决步骤:**
```javascript
// 在浏览器控制台测试连接
import { socketClient } from '@/lib/socketClient';

socketClient.connect()
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Error:', err));
```

---

### 2. 音频录制问题

#### 症状 2.1: "NotAllowedError: Permission denied"

```
DOMException: Permission denied
```

**原因:**
- 用户拒绝麦克风权限
- 浏览器隐私设置
- HTTPS 要求（某些浏览器）

**解决步骤:**
```javascript
// 测试麦克风访问
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ 麦克风已授权');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => {
    console.error('❌ 麦克风权限被拒绝:', err.name);
    console.error('错误详情:', err.message);
  });
```

**解决方案:**
1. 重新授予浏览器权限：
   - Chrome: 设置 → 隐私 → 网站设置 → 麦克风 → 允许 localhost:3000
   - Safari: 系统偏好设置 → 安全与隐私 → 麦克风

2. 检查浏览器是否支持 HTTPS（部分浏览器要求）

3. 确保在 HTTPS 或 localhost 上运行

#### 症状 2.2: "NotFoundError: No microphone device found"

```
DOMException: Requested device not found
```

**原因:**
- 系统未检测到麦克风
- 麦克风驱动程序问题
- 麦克风被其他应用独占

**解决步骤:**
```bash
# macOS: 检查麦克风设备
system_profiler SPAudioDataType

# 重新启动浏览器
# 检查其他应用是否占用麦克风
```

#### 症状 2.3: "NotReadableError: Could not start audio capture"

```
DOMException: Could not start audio capture
```

**原因:**
- 麦克风被占用
- 浏览器权限冲突
- 驱动程序问题

**解决步骤:**
```javascript
// 在录音前检查
const testAudio = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      }
    });
    console.log('✅ 音频捕获成功');
    stream.getTracks().forEach(t => t.stop());
  } catch (err) {
    console.error('❌ 音频捕获失败:', err.message);
  }
};
```

---

### 3. STT (Speech-to-Text) 问题

#### 症状 3.1: "Aliyun STT: Empty response"

```
错误: No token in response / STT transcription failed
```

**原因:**
- Aliyun 凭证不正确
- API 配额用尽
- 网络请求失败

**解决步骤:**
```bash
# 1. 验证环境变量
echo $ALIYUN_ACCESS_KEY_ID
echo $ALIYUN_ACCESS_KEY_SECRET

# 2. 检查阿里云控制台
# https://console.aliyun.com/

# 3. 查看后端日志
tail -f backend/logs/*.log | grep "Aliyun"

# 4. 测试凭证（在后端代码中）
import { aliyunSTTService } from '@/services/aliyunSTTService';

const testSTT = async () => {
  try {
    const result = await aliyunSTTService.transcribe(audioBuffer);
    console.log('✅ STT 成功:', result);
  } catch (err) {
    console.error('❌ STT 失败:', err.message);
  }
};
```

#### 症状 3.2: "Transcription text is empty"

**原因:**
- 音频太短或质量差
- 无法识别的语言
- OSS 上传失败

**解决步骤:**
```bash
# 1. 确保音频足够长（至少 1 秒）
# 2. 检查音频质量和格式
# 3. 验证 OSS Bucket 配置
# 4. 查看详细日志

# 在后端添加日志
logger.info('Audio transcription', {
  audioSize: audioData.length,
  duration: audioData.length / 32000, // 16kHz * 2 bytes
});
```

#### 症状 3.3: "OSS upload failed"

```
错误: Failed to upload audio to OSS
```

**原因:**
- OSS Bucket 不存在
- 凭证权限不足
- 网络连接问题

**解决步骤:**
```bash
# 1. 验证 OSS Bucket 存在
aws s3 ls s3://your-bucket --profile aliyun

# 2. 检查访问权限
# Aliyun 控制台 → OSS → Bucket 设置 → 权限

# 3. 测试上传
# 使用 @alicloud/oss-sdk-js 本地测试

# 4. 查看安全组规则
# 确保出站到 OSS 端点的连接被允许
```

---

### 4. AI 回复问题

#### 症状 4.1: "AI response generation failed"

```
错误: Failed to generate AI response
```

**原因:**
- AI API 不可用
- API 配额用尽
- 请求格式错误

**解决步骤:**
```bash
# 1. 检查 AI API 配置
echo $AI_API_KEY
echo $AI_API_BASE_URL

# 2. 测试 API 连接
curl -X POST https://api.gpt-best.com/v1/chat/completions \
  -H "Authorization: Bearer $AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "测试"}]
  }'

# 3. 检查后端日志
tail -f backend/logs/*.log | grep "AI"
```

#### 症状 4.2: "AI response is too slow"

**原因:**
- API 响应慢
- 网络延迟
- 模型过载

**解决步骤:**
```typescript
// 在 sessionManager.ts 中添加超时
const aiResponse = await Promise.race([
  aiService.chatCompletion(messages),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI timeout')), 10000)
  )
]);

// 或者降低 maxTokens
{
  temperature: 0.8,
  maxTokens: 100, // 减少 token 数量
}
```

---

### 5. 头像生成问题

#### 症状 5.1: "Avatar response video URL is broken"

```
错误: 404 Not Found for avatar video
```

**原因:**
- 视频生成服务离线
- 视频 URL 过期
- 文件未找到

**解决步骤:**
```bash
# 1. 检查视频生成服务状态
curl https://your-avatar-service/health

# 2. 验证视频 URL
curl -I https://your-video-url

# 3. 检查 OSS 中是否存在文件
# Aliyun 控制台 → OSS → 文件管理
```

---

### 6. 数据库问题

#### 症状 6.1: "Database connection failed"

```
错误: connect ECONNREFUSED 127.0.0.1:5432
```

**原因:**
- 数据库服务未运行
- 连接字符串不正确
- 防火墙阻止

**解决步骤:**
```bash
# 1. 检查数据库连接字符串
echo $DATABASE_URL

# 2. 测试连接
psql $DATABASE_URL -c "SELECT 1"

# 3. 启动数据库
# PostgreSQL: brew services start postgresql
# MySQL: brew services start mysql

# 4. 查看 Prisma 日志
PRISMA_DEBUG=1 npm run dev
```

#### 症状 6.2: "Migration failed"

```
错误: Migration failed with code 1
```

**原因:**
- Schema 变更冲突
- 数据库权限问题
- 迁移脚本错误

**解决步骤:**
```bash
# 1. 查看迁移状态
npx prisma migrate status

# 2. 重置数据库（开发环境）
npx prisma migrate reset

# 3. 手动迁移
npx prisma migrate dev --name add_realtime_fields

# 4. 生成 Prisma 客户端
npx prisma generate
```

---

### 7. 前端特定问题

#### 症状 7.1: "Module not found: Can't resolve 'socket.io-client'"

```
错误: Module not found
```

**原因:**
- 依赖未安装
- node_modules 损坏

**解决步骤:**
```bash
cd frontend

# 1. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 2. 检查 socket.io-client 是否存在
npm list socket.io-client

# 3. 清理 Next.js 缓存
rm -rf .next
npm run dev
```

#### 症状 7.2: "ReferenceError: window is not defined"

```
错误: window is not defined (SSR)
```

**原因:**
- 在服务端渲染中使用了浏览器 API

**解决步骤:**
```typescript
// 添加 'use client' 指令
'use client';

import { useRealtimeRoleplay } from '@/hooks/useRealtimeRoleplay';

// 或者使用动态导入
import dynamic from 'next/dynamic';

const RoleplayComponent = dynamic(
  () => import('@/components/RealtimeRoleplay'),
  { ssr: false }
);
```

---

### 8. 后端特定问题

#### 症状 8.1: "TypeScript compilation error"

```
error TS2339: Property 'xxx' does not exist
```

**原因:**
- 类型定义不匹配
- 导入不正确

**解决步骤:**
```bash
# 1. 检查类型错误
npx tsc --noEmit

# 2. 更新 Prisma 生成的类型
npx prisma generate

# 3. 清理编译缓存
rm -rf dist/
npm run build
```

#### 症状 8.2: "Memory leak in session management"

**症状:** 内存使用不断增加

**原因:**
- 会话未正确清理
- 音频缓冲未释放
- 事件监听器未移除

**解决步骤:**
```typescript
// 1. 检查会话清理
const stats = sessionManager.getStats();
console.log('Active sessions:', stats.activeSessions);
console.log('Memory usage:', stats.totalMemory);

// 2. 强制清理（调试）
sessionManager.cleanupStaleSessions();

// 3. 添加监控
setInterval(() => {
  const stats = sessionManager.getStats();
  if (stats.activeSessions > 100) {
    logger.warn('High session count', stats);
  }
}, 60000);
```

---

## 🛠️ 调试工具

### 后端调试

#### 启用详细日志
```bash
# 后端
LOG_LEVEL=debug npm run dev

# Socket.io 调试
DEBUG=socket.io* npm run dev

# Prisma 调试
PRISMA_DEBUG=1 npm run dev
```

#### 连接到远程调试器
```bash
# VSCode launch.json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/backend/src/index.ts",
  "preLaunchTask": "tsc: build",
  "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
}
```

### 前端调试

#### 浏览器开发工具
```javascript
// 1. Network 标签 → WS 过滤器查看 WebSocket 消息
// 2. Console 中测试
import { socketClient } from '@/lib/socketClient';
socketClient.getSocket().on('*', (event, ...args) => {
  console.log('Event:', event, args);
});

// 3. React DevTools 检查组件状态
```

#### 远程调试
```bash
# Chrome DevTools
chrome://inspect/#devices

# VS Code 调试前端
{
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:3000"
}
```

---

## 📊 性能分析

### 识别瓶颈

```javascript
// 1. 测量音频处理时间
console.time('audio-processing');
// ... 处理
console.timeEnd('audio-processing');

// 2. 监控 WebSocket 延迟
const start = performance.now();
socket.emit('audio-chunk', data);
socket.once('audio-received', () => {
  const latency = performance.now() - start;
  console.log('Latency:', latency, 'ms');
});

// 3. 检查内存使用
console.log('Memory:', performance.memory);
```

### 优化建议

```typescript
// 1. 减少音频分块大小
chunkInterval: 100, // 从 250ms 减少

// 2. 启用音频压缩
mimeType: 'audio/webm;codecs=opus',

// 3. 批量处理消息
// 每 N 个消息发送一次
```

---

## 📞 获取帮助

### 检查清单

在报告问题前，请确认：

- [ ] 所有环境变量已正确设置
- [ ] 后端和前端都已启动
- [ ] 浏览器是最新版本
- [ ] 已尝试清除缓存和重启
- [ ] 查看了完整的错误堆栈跟踪
- [ ] 检查了所有相关日志

### 收集调试信息

```bash
# 后端信息
node -v
npm -v
npm list socket.io

# 前端信息
npm list socket.io-client
npm list next

# 系统信息
uname -a
lsb_release -a  # Linux
system_profiler SPSoftwareDataType  # macOS
```

---

**🎯 记住:** 大多数问题可以通过检查日志和确认配置来解决。如果问题仍未解决，请收集上述调试信息并参考相关文档。
