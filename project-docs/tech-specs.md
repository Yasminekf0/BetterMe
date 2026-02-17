# 技术规格文档 / Technical Specifications

## 技术栈 / Tech Stack

### 前端 Frontend
- **框架**: Next.js 14+
- **UI库**: React 18+
- **状态管理**: React Context / Zustand
- **样式**: TailwindCSS + Shadcn/ui
- **HTTP客户端**: Axios / Fetch API

### 后端 Backend
- **运行时**: Node.js 18+
- **框架**: Express.js / NestJS
- **ORM**: Prisma / TypeORM
- **认证**: JWT + DingTalk OAuth (备选: Mock Login)
- **API规范**: RESTful API

### AI服务 AI Services
- **LLM**: 通义千问 (Tongyi Qianwen)
- **ASR/STT**: qwen3-asr-flash-realtime (Voice to Text)
- **场景**: 
  - 角色扮演对话
  - 反馈评估
  - 邮件生成
  - 语音转文字

### 数据库 Database
- **主数据库**: PostgreSQL (ApsaraDB)
- **缓存**: Redis (可选)

### 基础设施 Infrastructure
- **计算**: 阿里云 ECS
- **数据库**: ApsaraDB for PostgreSQL
- **对象存储**: OSS (可选)

---

## 架构原则 / Architecture Principles

1. **全面使用阿里云原生服务** - Fully Alibaba Cloud-native
2. **阿里云AI + 开源工具** - Alibaba Cloud AI + open-source tooling
3. **简单、可解释、演示安全** - Simple, explainable, demo-safe
4. **模块化设计** - Modular design
5. **可扩展性** - Scalability

---

## API端点设计 / API Endpoint Design

### 认证相关 Authentication
```
POST /api/auth/login          - 用户登录
POST /api/auth/logout         - 用户登出
GET  /api/auth/me             - 获取当前用户信息
POST /api/auth/dingtalk       - DingTalk OAuth回调
```

### 角色扮演 Roleplay
```
POST /api/roleplay/start      - 开始角色扮演会话
POST /api/roleplay/message    - 发送消息并获取AI回复
POST /api/roleplay/end        - 结束角色扮演会话
GET  /api/roleplay/history    - 获取历史会话
```

### 反馈评估 Feedback
```
POST /api/feedback/generate   - 生成对话反馈
GET  /api/feedback/:sessionId - 获取特定会话的反馈
```

### 邮件生成 Email Generation
```
POST /api/email/generate      - 生成跟进邮件
PUT  /api/email/:id           - 编辑邮件内容
```

### 场景管理 Scenario Management
```
GET  /api/scenarios           - 获取所有场景
GET  /api/scenarios/:id       - 获取特定场景
POST /api/scenarios           - 创建新场景 (Admin)
PUT  /api/scenarios/:id       - 更新场景 (Admin)
DELETE /api/scenarios/:id     - 删除场景 (Admin)
```

### 管理后台 Admin
```
GET    /api/admin/users              - 获取所有用户
GET    /api/admin/users/:id          - 获取用户详情和统计
PUT    /api/admin/users/:id          - 更新用户信息
DELETE /api/admin/users/:id          - 删除用户
GET    /api/admin/statistics         - 获取统计数据
GET    /api/admin/sessions           - 获取所有练习会话
```

### 系统设置 System Settings
```
GET    /api/admin/settings           - 获取所有系统设置
GET    /api/admin/settings/:category - 按类别获取设置
PUT    /api/admin/settings           - 批量更新设置
POST   /api/admin/settings/reset     - 重置为默认设置
```

### 操作日志 Operation Logs
```
GET    /api/admin/logs               - 获取操作日志（支持分页筛选）
```

### 买家角色模板 Buyer Persona Templates
```
GET    /api/admin/personas           - 获取所有角色模板
POST   /api/admin/personas           - 创建角色模板
PUT    /api/admin/personas/:id       - 更新角色模板
DELETE /api/admin/personas/:id       - 删除角色模板
```

### AI模型管理 AI Model Management
```
GET    /api/admin/ai-models          - 获取所有AI模型
GET    /api/admin/ai-models/available- 获取可用模型（含默认）
POST   /api/admin/ai-models          - 创建AI模型配置
PUT    /api/admin/ai-models/:id      - 更新AI模型
DELETE /api/admin/ai-models/:id      - 删除AI模型
```

### 数据导出 Data Export
```
GET    /api/admin/export/statistics  - 导出统计报告
```

---

## 数据模型 / Data Models

### User (用户)
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'trainer' | 'user';
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Scenario (场景)
```typescript
interface Scenario {
  id: string;
  title: string;
  description: string;
  buyerPersona: BuyerPersona;
  objections: string[];
  idealResponses: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### BuyerPersona (买家角色)
```typescript
interface BuyerPersona {
  name: string;
  role: string;        // e.g., 'CTO', 'Compliance Officer'
  company: string;
  background: string;
  concerns: string[];
  personality: string;
}
```

### Session (会话)
```typescript
interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  status: 'active' | 'completed' | 'abandoned';
  messages: Message[];
  feedback?: Feedback;
  startedAt: Date;
  completedAt?: Date;
}
```

### Message (消息)
```typescript
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}
```

### Feedback (反馈)
```typescript
interface Feedback {
  id: string;
  sessionId: string;
  overallScore: number;
  dimensions: FeedbackDimension[];
  summary: string;
  recommendations: string[];
  createdAt: Date;
}

interface FeedbackDimension {
  name: string;           // e.g., 'Value Articulation', 'Objection Handling'
  score: number;
  quote: string;          // 用户回答的引用
  explanation: string;    // 评分说明
}
```

### FollowUpEmail (跟进邮件)
```typescript
interface FollowUpEmail {
  id: string;
  sessionId: string;
  userId: string;
  subject: string;
  body: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### BuyerPersonaTemplate (买家角色模板)
```typescript
interface BuyerPersonaTemplate {
  id: string;
  name: string;
  role: string;           // e.g., 'CTO', 'Compliance Director'
  company: string;
  background: string;
  concerns: string[];
  personality: string;
  category: string;       // e.g., 'Technical', 'Business', 'Procurement'
  isDefault: boolean;
  isActive: boolean;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### OperationLog (操作日志)
```typescript
interface OperationLog {
  id: string;
  userId: string;
  operationType: string;  // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  targetType: string;     // USER, SCENARIO, SETTING, etc.
  targetId?: string;
  description: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

### SystemSetting (系统设置)
```typescript
interface SystemSetting {
  id: string;
  key: string;            // e.g., 'ai.defaultModel', 'system.name'
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}
```

### AIModel (AI模型配置)
```typescript
interface AIModel {
  id: string;
  modelId: string;        // e.g., 'gpt-4o', 'claude-3-sonnet', 'qwen3-asr-flash-realtime'
  name: string;
  provider: string;       // e.g., 'OpenAI', 'Anthropic', 'Alibaba'
  description?: string;
  type?: AIModelType;     // e.g., 'CHAT', 'TTS', 'STT', 'EMBEDDING'
  apiEndpoint?: string;   // Custom API endpoint / 自定义API地址
  apiKey?: string;        // Custom API key / 自定义API密钥
  isDefault: boolean;
  isActive: boolean;
  config?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// AI Model Types / AI模型类型
enum AIModelType {
  CHAT = 'CHAT',           // Text chat model / 文本对话模型
  TTS = 'TTS',             // Text-to-Speech model / 语音合成模型
  STT = 'STT',             // Speech-to-Text model / 语音转文字模型 (Voice to Text / ASR)
  EMBEDDING = 'EMBEDDING', // Embedding/Vector model / 向量模型
}
```

---

## 安全考虑 / Security Considerations

1. **认证**: JWT Token + Refresh Token机制
2. **授权**: 基于角色的访问控制 (RBAC)
3. **数据加密**: HTTPS传输 + 敏感数据加密存储
4. **输入验证**: 所有API输入进行严格验证
5. **速率限制**: API调用频率限制
6. **日志审计**: 关键操作记录审计日志

