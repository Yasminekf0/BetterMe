# Master Trainer - AI Sales Training System

<div align="center">
  <h3>🤖 AI That Coaches Like a Human</h3>
  <p>Transform your sales team from product knowledge to execution readiness</p>
</div>

---

## 📖 Overview

Master Trainer is an AI-powered sales training and coaching system that helps sales teams practice real conversations with AI-simulated buyers, receive detailed feedback, and generate professional follow-up emails.

### Key Features

- 🎭 **AI Roleplay Engine** - Practice realistic sales conversations with AI buyer personas
- 📊 **Explainable Feedback** - Get detailed, evidence-based feedback with actionable suggestions
- ✉️ **Email Generator** - One-click generation of professional follow-up emails
- 🎯 **Scenario Studio** - Low-code interface for creating and managing training scenarios
- 📈 **Analytics Dashboard** - Track progress and identify improvement areas

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+
- **Styling**: TailwindCSS + Shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: React Query + Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT

### AI Services
- **API**: Supports multiple AI models via unified API (GPT-4, Claude, Qwen, etc.)
- **Documentation**: https://gpt-best.apifox.cn/doc-3530850

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- AI API key (from supported provider)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Betterme
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Configure environment variables**

Create `.env` files in both `frontend` and `backend` directories:

**Backend `.env`:**
```env
DATABASE_URL="postgresql://betterme:betterme@localhost:5432/betterme?schema=public"
JWT_SECRET="your-jwt-secret"
AI_API_BASE_URL="https://api.gpt-best.com/v1"
AI_API_KEY="your-ai-api-key"
AI_DEFAULT_MODEL="gpt-4o-mini"
PORT=3001
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. **Setup database**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Start development servers**
```bash
# From root directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Default Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mastertrainer.com | admin123 |
| Trainer | trainer@mastertrainer.com | trainer123 |
| User | demo@mastertrainer.com | demo123 |

## 📁 Project Structure

```
Betterme/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and API client
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   └── ...
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── config/          # Configuration
│   └── prisma/              # Database schema
├── project-docs/            # Project documentation
└── 需求文档/                 # Requirements documents
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Scenarios
- `GET /api/scenarios` - List scenarios
- `GET /api/scenarios/:id` - Get scenario details
- `GET /api/scenarios/recommended` - Get recommendations

### Roleplay
- `POST /api/roleplay/start` - Start session
- `POST /api/roleplay/message` - Send message
- `POST /api/roleplay/end` - End session
- `GET /api/roleplay/history` - Get history

### Feedback
- `POST /api/feedback/generate` - Generate feedback
- `GET /api/feedback/:sessionId` - Get feedback

### Admin
- `GET /api/admin/scenarios` - Manage scenarios
- `GET /api/admin/users` - Manage users
- `GET /api/admin/statistics` - View statistics
- `GET /api/admin/ai-models` - List AI models

## 🤖 Supported AI Models

The system supports multiple AI models via a unified API:

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo |
| Anthropic | Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku |
| Alibaba | Qwen Max, Qwen Plus, Qwen Turbo |
| DeepSeek | DeepSeek Chat, DeepSeek Coder |

## 📝 License

MIT License - see LICENSE file for details.

---

<div align="center">
  <p>Built with ❤️ for sales excellence</p>
</div>

