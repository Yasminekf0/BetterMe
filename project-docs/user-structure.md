# 用户流程与项目结构 / User Flows & Project Structure

## 用户旅程 / User Journeys

### 销售代表用户旅程 / Sales Rep User Journey

```
[登录] → [仪表板] → [选择场景] → [开始角色扮演] → [多轮对话] → [结束对话] → [查看反馈] → [生成跟进邮件] → [编辑/保存邮件]
```

**详细步骤**:

1. **登录系统**
   - DingTalk OAuth登录 或 邮箱密码登录
   - 首次登录完善个人资料

2. **进入仪表板**
   - 查看最近练习记录
   - 查看推荐场景
   - 查看个人进步统计

3. **选择练习场景**
   - 按类别浏览场景
   - 按难度筛选
   - 查看场景详情

4. **开始角色扮演**
   - 阅读场景背景
   - 了解买家角色信息
   - 开始对话

5. **多轮对话**
   - 与AI买家进行6-8轮对话
   - 实时显示对话历史
   - 可随时结束

6. **查看反馈**
   - 查看总体评分
   - 查看各维度详细评分
   - 查看改进建议

7. **生成跟进邮件**
   - 一键生成基于对话的邮件
   - 编辑邮件内容
   - 复制或保存

---

### 培训管理员用户旅程 / Enablement Admin User Journey

```
[登录] → [管理后台] → [场景管理/用户统计/系统设置]
```

**场景管理流程**:
```
[场景列表] → [创建/编辑场景] → [设置买家角色] → [添加异议] → [设置理想回答] → [预览测试] → [发布]
```

---

## 数据流程 / Data Flow

### 角色扮演数据流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户输入   │ ──► │  后端API    │ ──► │  AI服务     │
│  (前端)     │     │  (Node.js)  │     │ (通义千问)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   数据库    │ ◄── │  AI响应     │
                    │ (PostgreSQL)│     │             │
                    └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  返回前端   │
                    │  展示对话   │
                    └─────────────┘
```

### 反馈生成数据流

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  对话历史   │ ──► │  反馈引擎   │ ──► │  结构化反馈 │
│            │     │  (AI分析)   │     │  (JSON)     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  存储 & 展示 │
                                       └─────────────┘
```

---

## 项目文件结构 / Project File Structure

```
master-trainer/
├── README.md
├── package.json
├── .env.example
├── .gitignore
│
├── frontend/                          # Next.js 前端
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   │
│   ├── public/                        # 静态资源
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── src/
│   │   ├── app/                       # App Router 页面
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # 首页/登录
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # 用户仪表板
│   │   │   ├── scenarios/
│   │   │   │   ├── page.tsx           # 场景列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # 场景详情
│   │   │   ├── roleplay/
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx       # 角色扮演页面
│   │   │   ├── feedback/
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx       # 反馈页面
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # 个人中心
│   │   │   └── admin/                 # 管理后台
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx           # 管理仪表板
│   │   │       ├── scenarios/
│   │   │       │   ├── page.tsx       # 场景管理
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx   # 编辑场景
│   │   │       ├── users/
│   │   │       │   └── page.tsx       # 用户管理
│   │   │       └── statistics/
│   │   │           └── page.tsx       # 统计数据
│   │   │
│   │   ├── components/                # React组件
│   │   │   ├── ui/                    # 基础UI组件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/                # 布局组件
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── chat/                  # 聊天相关组件
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   ├── feedback/              # 反馈相关组件
│   │   │   │   ├── ScoreCard.tsx
│   │   │   │   ├── DimensionChart.tsx
│   │   │   │   └── RecommendationList.tsx
│   │   │   └── scenario/              # 场景相关组件
│   │   │       ├── ScenarioCard.tsx
│   │   │       ├── ScenarioForm.tsx
│   │   │       └── PersonaEditor.tsx
│   │   │
│   │   ├── hooks/                     # 自定义Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   └── useScenario.ts
│   │   │
│   │   ├── lib/                       # 工具库
│   │   │   ├── api.ts                 # API客户端
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── store/                     # 状态管理
│   │   │   ├── authStore.ts
│   │   │   └── chatStore.ts
│   │   │
│   │   └── types/                     # TypeScript类型
│   │       ├── index.ts
│   │       ├── user.ts
│   │       ├── scenario.ts
│   │       └── session.ts
│   │
│   └── styles/                        # 全局样式
│       └── globals.css
│
├── backend/                           # Node.js 后端
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── src/
│   │   ├── index.ts                   # 应用入口
│   │   ├── app.ts                     # Express应用配置
│   │   │
│   │   ├── config/                    # 配置文件
│   │   │   ├── database.ts
│   │   │   ├── ai.ts
│   │   │   └── auth.ts
│   │   │
│   │   ├── controllers/               # 控制器
│   │   │   ├── authController.ts
│   │   │   ├── roleplayController.ts
│   │   │   ├── feedbackController.ts
│   │   │   ├── emailController.ts
│   │   │   ├── scenarioController.ts
│   │   │   └── adminController.ts
│   │   │
│   │   ├── services/                  # 业务服务
│   │   │   ├── authService.ts
│   │   │   ├── aiService.ts           # AI服务封装
│   │   │   ├── roleplayService.ts
│   │   │   ├── feedbackService.ts
│   │   │   ├── emailService.ts
│   │   │   └── scenarioService.ts
│   │   │
│   │   ├── models/                    # 数据模型
│   │   │   ├── User.ts
│   │   │   ├── Scenario.ts
│   │   │   ├── Session.ts
│   │   │   ├── Message.ts
│   │   │   ├── Feedback.ts
│   │   │   └── FollowUpEmail.ts
│   │   │
│   │   ├── routes/                    # 路由定义
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── roleplay.ts
│   │   │   ├── feedback.ts
│   │   │   ├── email.ts
│   │   │   ├── scenario.ts
│   │   │   └── admin.ts
│   │   │
│   │   ├── middleware/                # 中间件
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimiter.ts
│   │   │
│   │   ├── prompts/                   # AI提示词
│   │   │   ├── roleplay.ts
│   │   │   ├── feedback.ts
│   │   │   └── email.ts
│   │   │
│   │   ├── utils/                     # 工具函数
│   │   │   ├── logger.ts
│   │   │   ├── validator.ts
│   │   │   └── helpers.ts
│   │   │
│   │   └── types/                     # TypeScript类型
│   │       └── index.ts
│   │
│   └── prisma/                        # Prisma ORM
│       ├── schema.prisma
│       └── migrations/
│
├── database/                          # 数据库相关
│   ├── seeds/                         # 种子数据
│   │   ├── scenarios.ts
│   │   └── users.ts
│   └── scripts/
│       └── init.sql
│
├── docs/                              # 项目文档
│   ├── api/                           # API文档
│   ├── deployment/                    # 部署文档
│   └── design/                        # 设计文档
│
└── scripts/                           # 脚本文件
    ├── setup.sh
    └── deploy.sh
```

---

## 页面路由 / Page Routes

| 路由 | 页面 | 权限 |
|------|------|------|
| `/` | 首页/登录 | Public |
| `/dashboard` | 用户仪表板 | User |
| `/scenarios` | 场景列表 | User |
| `/scenarios/:id` | 场景详情 | User |
| `/roleplay/:sessionId` | 角色扮演 | User |
| `/feedback/:sessionId` | 反馈查看 | User |
| `/profile` | 个人中心 | User |
| `/admin` | 管理仪表板 | Admin |
| `/admin/scenarios` | 场景管理 | Admin |
| `/admin/scenarios/:id` | 编辑场景 | Admin |
| `/admin/users` | 用户管理 | Admin |
| `/admin/statistics` | 统计数据 | Admin |

