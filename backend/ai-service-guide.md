# AI Service Integration Guide / AI服务集成指南

> 本文档介绍如何在 BetterMe 项目中调用 AI 模型服务
> This document explains how to use AI model services in the BetterMe project

---

## 目录 / Table of Contents

1. [概述 / Overview](#概述--overview)
2. [环境配置 / Environment Configuration](#环境配置--environment-configuration)
3. [后端调用方式 / Backend Usage](#后端调用方式--backend-usage)
4. [前端调用方式 / Frontend Usage](#前端调用方式--frontend-usage)
5. [API参考 / API Reference](#api参考--api-reference)
6. [RAG向量检索 / RAG Vector Search](#rag向量检索--rag-vector-search)
7. [常见问题 / FAQ](#常见问题--faq)

---

## 概述 / Overview

BetterMe 项目集成了阿里云百炼（DashScope）大模型服务，支持以下功能：

The BetterMe project integrates Aliyun Bailian (DashScope) AI models, supporting:

| 功能 / Feature | 模型类型 / Model Type | 用途 / Usage |
|---------------|---------------------|-------------|
| 文本对话 / Text Chat | CHAT | 角色扮演对话、聊天机器人 / Roleplay conversation, chatbot |
| 向量生成 / Embedding | EMBEDDING | RAG检索、语义搜索 / RAG retrieval, semantic search |
| 语音合成 / TTS | TTS | 文字转语音 / Text to speech |
| 语音识别 / STT | STT | 语音转文字 / Speech to text |

**架构说明 / Architecture:**
```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐
│   Frontend  │ ───▶ │   Backend   │ ───▶ │  Aliyun Bailian  │
│   前端页面   │      │   后端API   │      │   阿里云百炼      │
└─────────────┘      └─────────────┘      └──────────────────┘
```

> ⚠️ **安全提示 / Security Note:** 
> 前端不直接调用AI API，所有请求通过后端代理，API Key 安全存储在服务端。
> Frontend never calls AI API directly. All requests go through backend proxy. API Key is securely stored on server.

---

## 环境配置 / Environment Configuration

### 1. 获取API密钥 / Get API Key

1. 登录 [阿里云百炼控制台](https://bailian.console.aliyun.com/)
   Login to [Aliyun Bailian Console](https://bailian.console.aliyun.com/)

2. 进入「API-KEY管理」
   Go to "API-KEY Management"

3. 点击「创建API-KEY」
   Click "Create API-KEY"

4. 复制生成的密钥
   Copy the generated key

### 2. 配置说明 / Configuration

**重要：AI模型配置采用双层架构 / Important: AI model config uses dual-layer architecture**

所有模型均使用阿里云百炼(DashScope) / All models use Aliyun Bailian (DashScope)

```
┌─────────────────────────────────────────────────────────────┐
│                    配置优先级 / Config Priority              │
├─────────────────────────────────────────────────────────────┤
│  1. MySQL数据库 ai_models 表 (优先) / Database (Primary)    │
│     - 每个模型独立配置API地址和密钥                          │
│     - Each model has its own API endpoint and key           │
│     - 支持CHAT/EMBEDDING/TTS/STT/MULTIMODAL五种类型         │
├─────────────────────────────────────────────────────────────┤
│  2. .env 环境变量 (备用) / Environment Variables (Fallback) │
│     - 当数据库模型未指定时使用                               │
│     - Used when database model not specified                │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1 数据库中的模型配置 / Database Model Configuration

MySQL `ai_models` 表中当前配置 / Current configs in ai_models table:

**重要：每种模型类型使用不同的API地址！**
**Important: Each model type uses a DIFFERENT API endpoint!**

| Model ID | 类型 | API Endpoint (每个都不同!) |
|----------|------|---------------------------|
| `qwen3-max` | CHAT | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `text-embedding-v2` | EMBEDDING | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `qwen2.5-vl-embedding` | MULTIMODAL | `https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding` |
| `qwen3-tts-flash` | TTS | `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` |
| `qwen3-asr-flash-realtime` | STT | `wss://dashscope.aliyuncs.com/api-ws/v1/realtime` (WebSocket) |

**API Key安全存储 / API Key Security:**
> API Key存储在数据库`ai_models`表的`apiKey`字段中，所有模型共用同一个Key。
> 代码中应通过 `model.apiKey` 从数据库读取，禁止硬编码！
> 
> API Key is stored in `apiKey` field of database. All models share the same key.
> Always read via `model.apiKey` from database, NEVER hardcode!

#### 2.2 环境变量配置 / Environment Variables

编辑 `backend/.env` 文件 / Edit `backend/.env` file:

```bash
# ==================== AI API Configuration (Aliyun Bailian) / AI API配置(阿里云百炼) ====================
# 重要: API Key和API地址存储在MySQL ai_models表中，通过数据库查询获取
# Important: API Key and endpoints stored in MySQL ai_models table, retrieved via DB query
#
# API文档 / API Documentation: https://help.aliyun.com/zh/model-studio/
#
# 注意: API Key不在.env中配置，而是存储在数据库中
# Note: API Key is NOT configured here, but stored in database

# 请求配置（备用）/ Request Configuration (fallback)
AI_TIMEOUT=30000        # 超时时间(毫秒) / Timeout (ms)
AI_MAX_TOKENS=2000      # 最大令牌数 / Max tokens
AI_TEMPERATURE=0.7      # 温度参数 / Temperature
```

> ⚠️ **安全提示 / Security Note:**
> - API Key存储在数据库`ai_models`表的`apiKey`字段中
> - 代码中通过 `prisma.aIModel.findUnique()` 查询获取
> - 禁止在代码或配置文件中硬编码API Key！

### 3. 可用模型列表 / Available Models (阿里云百炼)

| 模型ID / Model ID | 类型 / Type | 说明 / Description |
|------------------|------------|-------------------|
| `qwen3-max` | CHAT | 通义千问3 Max对话模型 / Qwen3 Max chat model |
| `text-embedding-v2` | EMBEDDING | 文本向量模型(RAG用) / Text embedding for RAG |
| `qwen2.5-vl-embedding` | MULTIMODAL | 多模态向量模型 / Multimodal embedding |
| `qwen3-tts-flash` | TTS | 语音合成模型 / Text-to-Speech |
| `qwen3-asr-flash-realtime` | STT | 实时语音识别(WebSocket) / Real-time ASR |

---

## 后端调用方式 / Backend Usage

### 导入服务 / Import Service

```typescript
import { aiService, AIModelType } from '../services/aiService';
```

### 1. 文本对话 / Text Chat

```typescript
import { prisma } from '../lib/prisma';
import { aiService } from '../services/aiService';

/**
 * 推荐方式：从数据库读取模型配置（API Key安全存储在数据库中）
 * Recommended: Read model config from database (API Key securely stored in DB)
 */
async function chatWithDatabaseConfig(userMessage: string) {
  // 1. 从数据库获取模型配置 / Get model config from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: 'qwen3-max' }
  });

  if (!model) throw new Error('Model not found');

  // 2. 使用数据库中的配置调用AI / Call AI with database config
  const response = await aiService.chatCompletion(
    [
      { role: 'system', content: '你是一个专业的销售顾问' },
      { role: 'user', content: userMessage }
    ],
    {
      model: model.modelId,
      apiEndpoint: model.apiEndpoint || undefined,  // 从数据库读取
      apiKey: model.apiKey || undefined,            // 从数据库读取，不硬编码！
      temperature: 0.7,
      maxTokens: 2000,
    }
  );

  return response;
}

// 使用示例 / Usage
const reply = await chatWithDatabaseConfig('如何处理客户的价格异议？');
console.log(reply);
```

### 2. 角色扮演对话 / Roleplay Conversation

```typescript
/**
 * 生成买家角色的回复（从数据库获取模型配置）
 * Generate buyer persona response (with DB model config)
 */
async function generateBuyerResponseWithDB() {
  // 从数据库获取CHAT模型配置 / Get CHAT model from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: 'qwen3-max' }
  });
  if (!model) throw new Error('Model not found');

  const buyerResponse = await aiService.generateBuyerResponse(
    '这是一个企业软件销售场景，客户是一家中型制造企业的IT总监',
    'Name: 张经理, Role: IT总监, Company: 某制造企业. Background: 10年IT经验',
    [
      { role: 'assistant', content: '您好，我是张经理。' },
      { role: 'user', content: '张总您好，我们的系统可以帮您提升30%的效率。' }
    ],
    '我们有完善的数据加密方案，可以确保您的数据安全。',
    model.modelId  // 使用数据库中的 qwen3-max
  );
  return buyerResponse;
}
```

### 3. 生成反馈评估 / Generate Feedback

```typescript
/**
 * 为完成的对话生成评估反馈（从数据库获取模型配置）
 * Generate evaluation feedback (with DB model config)
 */
async function generateFeedbackWithDB(conversationHistory: ChatMessage[]) {
  // 从数据库获取CHAT模型配置 / Get CHAT model from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: 'qwen3-max' }
  });
  if (!model) throw new Error('Model not found');

  const feedback = await aiService.generateFeedback(
    '企业软件销售场景',
    ['强调产品的核心价值主张', '用数据支撑你的论点', '主动询问客户的具体需求'],
    conversationHistory,
    model.modelId  // 使用数据库中的 qwen3-max
  );
  return feedback;
}

// 返回结构 / Return structure
console.log(feedback);
/*
{
  overallScore: 85,
  dimensions: [
    {
      name: 'Value Articulation',
      score: 90,
      weight: 35,
      quote: '...',
      explanation: '...',
      suggestions: ['...']
    },
    // ... more dimensions
  ],
  summary: '整体表现良好...',
  recommendations: ['建议1', '建议2']
}
*/
```

### 4. 向量生成 / Generate Embedding (RAG)

```typescript
/**
 * 从数据库获取向量模型配置并生成向量
 * Get embedding model config from database and generate embedding
 */
async function generateEmbeddingWithDBConfig(text: string | string[]) {
  // 从数据库获取向量模型配置 / Get embedding model from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: 'text-embedding-v2' }
  });

  if (!model) throw new Error('Embedding model not found');

  // 使用数据库配置生成向量 / Generate embedding with DB config
  const embedding = await aiService.generateEmbedding(
    text,
    model.modelId,
    {
      apiEndpoint: model.apiEndpoint || undefined,  // 从数据库读取
      apiKey: model.apiKey || undefined,            // 从数据库读取
    }
  );

  return embedding;
}

// 单文本向量化 / Single text
const embedding = await generateEmbeddingWithDBConfig('这是需要向量化的文本');
// 返回 number[]

// 批量向量化 / Batch embedding
const embeddings = await generateEmbeddingWithDBConfig(['文本1', '文本2', '文本3']);
// 返回 number[][]
```

### 5. 语音合成 TTS / Text to Speech

```typescript
/**
 * 从数据库获取TTS模型配置并合成语音
 * Get TTS model config from database and synthesize speech
 */
async function textToSpeechWithDBConfig(text: string) {
  // 从数据库获取TTS模型配置 / Get TTS model from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: 'qwen3-tts-flash' }
  });

  if (!model) throw new Error('TTS model not found');

  const audioBuffer = await aiService.textToSpeech(text, {
    model: model.modelId,
    voice: 'Cherry',
    format: 'mp3',
    speed: 1.0,
    apiEndpoint: model.apiEndpoint || undefined,  // 从数据库读取
    apiKey: model.apiKey || undefined,            // 从数据库读取
  });

  return audioBuffer; // Buffer类型，可发送给客户端或保存为文件
}

// 使用示例
const audio = await textToSpeechWithDBConfig('你好，欢迎使用我们的产品。');
```

### 6. 语音识别 STT / Speech to Text

```typescript
/**
 * 从数据库获取STT模型配置并识别语音
 * Get STT model config from database and recognize speech
 * 注意: STT使用WebSocket连接 / Note: STT uses WebSocket connection
 */
async function speechToTextWithDBConfig(audioBuffer: Buffer) {
  // 从数据库获取STT模型配置 / Get STT model from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: 'qwen3-asr-flash-realtime' }
  });

  if (!model) throw new Error('STT model not found');

  const result = await aiService.speechToText(audioBuffer, {
    model: model.modelId,
    format: 'pcm',
    sampleRate: 16000,
    language: 'zh',
    apiKey: model.apiKey || undefined,  // 从数据库读取
  });

  return result;
}

// 使用示例
const result = await speechToTextWithDBConfig(audioBuffer);
console.log(result.text); // 识别出的文字
```

### 7. 从数据库读取模型配置 / Read Model Config from Database

```typescript
import { prisma } from '../lib/prisma';
import { aiService, AIModelType } from '../services/aiService';

/**
 * 从数据库获取模型配置并调用 / Get model config from DB and call
 * 推荐方式：动态读取数据库配置 / Recommended: Dynamic DB config
 */
async function callWithDatabaseModel(
  modelId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
) {
  // 1. 从数据库读取模型配置 / Read model config from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId: modelId }
  });

  if (!model || !model.isActive) {
    throw new Error(`Model ${modelId} not found or inactive`);
  }

  // 2. 使用数据库配置调用AI / Call AI with database config
  const response = await aiService.chatCompletion(messages, {
    model: model.modelId,
    apiEndpoint: model.apiEndpoint || undefined,
    apiKey: model.apiKey || undefined,
  });

  return response;
}

// 使用示例 / Usage example
const reply = await callWithDatabaseModel('qwen3-max', [
  { role: 'user', content: '你好' }
]);

/**
 * 获取所有可用的对话模型 / Get all available chat models
 */
async function getAvailableChatModels() {
  const models = await prisma.aIModel.findMany({
    where: {
      category: 'CHAT',
      isActive: true
    }
  });
  return models;
}

/**
 * 获取默认模型 / Get default model by category
 */
async function getDefaultModel(category: string) {
  const model = await prisma.aIModel.findFirst({
    where: {
      category: category as any,
      isDefault: true,
      isActive: true
    }
  });
  return model;
}
```

### 8. 测试连接 / Test Connection

```typescript
/**
 * 测试数据库中配置的模型连接 / Test database-configured model connection
 */
async function testModelWithDBConfig(modelId: string) {
  // 从数据库获取模型配置 / Get model config from database
  const model = await prisma.aIModel.findUnique({
    where: { modelId }
  });

  if (!model) throw new Error('Model not found');

  // 使用数据库配置测试连接 / Test connection with DB config
  const testResult = await aiService.testModelConnection(
    model.modelId,
    model.category as AIModelType,
    {
      apiEndpoint: model.apiEndpoint || undefined,
      apiKey: model.apiKey || undefined,  // 从数据库读取，不硬编码
    }
  );

  return testResult;
}

// 使用示例
const result = await testModelWithDBConfig('qwen3-max');
console.log(result);
/*
{
  success: true,
  responseTime: 1234,
  message: 'Chat model connection successful / 对话模型连接成功'
}
*/
```

---

## 前端调用方式 / Frontend Usage

前端通过调用后端API来间接使用AI服务。

Frontend uses AI services indirectly through backend APIs.

### 角色扮演API / Roleplay API

#### 开始会话 / Start Session

```typescript
// POST /api/roleplay/start
const response = await fetch('/api/roleplay/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    scenarioId: 'scenario-uuid'
  })
});

const { success, data } = await response.json();
// data.id - 会话ID / Session ID
// data.messages - 初始消息（AI的开场白）/ Initial messages
```

#### 发送消息 / Send Message

```typescript
// POST /api/roleplay/message
const response = await fetch('/api/roleplay/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: 'session-uuid',
    content: '用户输入的消息内容'
  })
});

const { success, data } = await response.json();
// data.userMessage - 用户消息记录 / User message record
// data.aiMessage - AI回复 / AI response
// data.turnsRemaining - 剩余对话轮数 / Remaining turns
```

#### 结束会话 / End Session

```typescript
// POST /api/roleplay/end
const response = await fetch('/api/roleplay/end', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: 'session-uuid'
  })
});
```

#### 获取会话详情 / Get Session Details

```typescript
// GET /api/roleplay/session/:sessionId
const response = await fetch(`/api/roleplay/session/${sessionId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// data.scenario - 场景信息
// data.messages - 所有消息
// data.feedback - 反馈（如有）
```

#### 获取历史记录 / Get History

```typescript
// GET /api/roleplay/history?page=1&pageSize=10
const response = await fetch('/api/roleplay/history?page=1&pageSize=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();
// data.items - 会话列表
// data.total - 总数
// data.totalPages - 总页数
```

### React Hook 示例 / React Hook Example

```typescript
// hooks/useRoleplay.ts
import { useState } from 'react';

export function useRoleplay() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);

  // 开始会话 / Start session
  const startSession = async (scenarioId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/roleplay/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ scenarioId })
      });
      const { data } = await res.json();
      setSession(data);
      setMessages(data.messages || []);
      return data;
    } finally {
      setLoading(false);
    }
  };

  // 发送消息 / Send message
  const sendMessage = async (content: string) => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/roleplay/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          content
        })
      });
      const { data } = await res.json();
      setMessages(prev => [...prev, data.userMessage, data.aiMessage]);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { loading, session, messages, startSession, sendMessage };
}
```

---

## API参考 / API Reference

### aiService 方法列表 / Methods

| 方法 / Method | 说明 / Description | 返回类型 / Return Type |
|--------------|-------------------|----------------------|
| `chatCompletion(messages, options?)` | 文本对话 / Text chat | `Promise<string>` |
| `generateBuyerResponse(...)` | 生成买家回复 / Generate buyer response | `Promise<string>` |
| `generateFeedback(...)` | 生成评估反馈 / Generate feedback | `Promise<FeedbackResult>` |
| `generateFollowUpEmail(...)` | 生成跟进邮件 / Generate follow-up email | `Promise<{subject, body}>` |
| `generateEmbedding(input, model?)` | 生成向量 / Generate embedding | `Promise<number[] \| number[][]>` |
| `textToSpeech(text, options?)` | 语音合成 / TTS | `Promise<Buffer>` |
| `speechToText(audio, options?)` | 语音识别 / STT | `Promise<STTResponse>` |
| `testConnection()` | 测试连接 / Test connection | `Promise<boolean>` |
| `testModelConnection(modelId, type?)` | 测试模型 / Test model | `Promise<TestResult>` |
| `getAvailableModels()` | 获取可用模型 / Get available models | `AIModelInfo[]` |
| `getModelsByType(type)` | 按类型获取模型 / Get models by type | `AIModelInfo[]` |

### ChatMessage 接口 / Interface

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### AIModelType 枚举 / Enum

```typescript
enum AIModelType {
  CHAT = 'CHAT',           // 文本对话
  TTS = 'TTS',             // 语音合成
  STT = 'STT',             // 语音识别
  EMBEDDING = 'EMBEDDING', // 向量模型
  MULTIMODAL = 'MULTIMODAL' // 多模态
}
```

---

## RAG向量检索 / RAG Vector Search

### 工作流程 / Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  文档切分    │ ──▶ │  向量化存储   │ ──▶ │  相似度检索   │
│  Split Docs  │     │  Embed+Store │     │  Similarity  │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   AI回答    │ ◀── │  构建Prompt  │ ◀── │  检索结果    │
│  AI Answer  │     │ Build Prompt │     │   Results    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 实现示例 / Implementation Example

```typescript
import { aiService } from '../services/aiService';

/**
 * RAG检索增强生成示例 / RAG Example
 */
async function ragQuery(userQuestion: string, knowledgeBase: string[]) {
  // 1. 向量化用户问题 / Embed user question
  const questionEmbedding = await aiService.generateEmbedding(userQuestion);
  
  // 2. 向量化知识库（实际应预先计算并存储）
  //    Embed knowledge base (should be pre-computed in production)
  const kbEmbeddings = await aiService.generateEmbedding(knowledgeBase);
  
  // 3. 计算相似度并检索 / Calculate similarity and retrieve
  const similarities = kbEmbeddings.map((emb, idx) => ({
    text: knowledgeBase[idx],
    score: cosineSimilarity(questionEmbedding, emb)
  }));
  
  // 4. 获取最相关的文档 / Get most relevant documents
  const topDocs = similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(d => d.text);
  
  // 5. 构建增强Prompt / Build augmented prompt
  const context = topDocs.join('\n\n');
  const augmentedPrompt = `
基于以下参考资料回答问题：
Based on the following references, answer the question:

参考资料 / References:
${context}

问题 / Question: ${userQuestion}

请给出准确、简洁的回答。
Please provide an accurate and concise answer.
`;

  // 6. 调用AI生成回答 / Call AI to generate answer
  const answer = await aiService.chatCompletion([
    { role: 'system', content: '你是一个专业的知识助手，基于提供的参考资料回答问题。' },
    { role: 'user', content: augmentedPrompt }
  ]);
  
  return {
    answer,
    sources: topDocs
  };
}

// 余弦相似度计算 / Cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### 使用DashVector向量数据库 / Using DashVector

配置 `.env` 文件 / Configure `.env`:

```bash
# DashVector向量数据库配置 / DashVector Configuration
DASHVECTOR_API_KEY=your-api-key
DASHVECTOR_ENDPOINT=vrs-xxx.dashvector.cn-hangzhou.aliyuncs.com
DASHVECTOR_COLLECTION=your-collection-name
```

---

## 常见问题 / FAQ

### Q1: API调用返回401错误 / API returns 401 error

**原因 / Cause:** API Key 无效或未配置
**解决 / Solution:** 
1. 检查 `.env` 文件中的 `DASHSCOPE_API_KEY` 是否正确
2. 确认API Key未过期
3. 重启后端服务

### Q2: 响应超时 / Response timeout

**原因 / Cause:** 网络问题或请求过大
**解决 / Solution:**
1. 增加 `AI_TIMEOUT` 配置值
2. 减少 `AI_MAX_TOKENS` 值
3. 检查网络连接

### Q3: 向量维度不匹配 / Embedding dimension mismatch

**原因 / Cause:** 使用了不同的向量模型
**解决 / Solution:** 确保存储和检索使用相同的向量模型

### Q4: TTS没有声音输出 / TTS produces no audio

**原因 / Cause:** 音色或格式配置错误
**解决 / Solution:**
1. 使用支持的音色: `longxiaochun`, `Cherry` 等
2. 使用支持的格式: `mp3`, `wav`, `pcm`

### Q5: 如何切换模型 / How to switch models

```typescript
// 推荐方式: 从数据库读取配置（API Key安全存储）
// Recommended: Read config from database (API Key securely stored)
async function callModel(modelId: string, messages: ChatMessage[]) {
  const model = await prisma.aIModel.findUnique({ where: { modelId } });
  if (!model) throw new Error('Model not found');
  
  return await aiService.chatCompletion(messages, {
    model: model.modelId,
    apiEndpoint: model.apiEndpoint || undefined,
    apiKey: model.apiKey || undefined,  // 从数据库读取，不硬编码！
  });
}

// 切换到不同模型只需改modelId
await callModel('qwen3-max', messages);      // 对话模型
await callModel('text-embedding-v2', messages); // 向量模型
```

### Q6: 数据库和.env配置的区别 / Difference between DB and .env config

| 配置方式 / Config Method | 优点 / Pros | 缺点 / Cons |
|-------------------------|------------|------------|
| **数据库配置** / Database | 支持多模型、可热更新、可通过管理后台管理 | 需要数据库查询 |
| **.env配置** / .env | 简单、适合单模型场景 | 需重启服务才能生效 |

**当前系统配置 / Current System Config:**
- 数据库中配置了5个阿里云百炼模型（qwen3-max, text-embedding-v2, qwen2.5-vl-embedding, qwen3-tts-flash, qwen3-asr-flash-realtime）
- .env中配置阿里云百炼默认参数作为备用

---

## 数据库模型配置参考 / Database Model Config Reference

当前MySQL `ai_models` 表中的完整配置 / Complete config in ai_models table:

```sql
-- 查看所有AI模型配置 / View all AI model configs
SELECT modelId, name, category, apiEndpoint, isActive FROM ai_models;
```

**每种模型类型的完整API地址 / Complete API URLs for each model type:**

| modelId | category | 完整API Endpoint |
|---------|----------|------------------|
| `qwen3-max` | CHAT | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `text-embedding-v2` | EMBEDDING | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `qwen2.5-vl-embedding` | MULTIMODAL | `https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding` |
| `qwen3-tts-flash` | TTS | `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` |
| `qwen3-asr-flash-realtime` | STT | `wss://dashscope.aliyuncs.com/api-ws/v1/realtime` |

> ⚠️ **安全提示 / Security Note:** 
> API Key存储在数据库`ai_models`表的`apiKey`字段中，代码中通过数据库查询获取，不应硬编码在代码中。
> API Key is stored in `apiKey` field of `ai_models` table. Always retrieve via database query, never hardcode in source code.

---

## 更新日志 / Changelog

| 日期 / Date | 版本 / Version | 说明 / Description |
|------------|---------------|-------------------|
| 2026-01-17 | v1.1.0 | 添加数据库模型配置说明，更新为实际配置 / Added database model config, updated to actual config |
| 2026-01-17 | v1.0.0 | 初始版本 / Initial version |

---

*最后更新 / Last Updated: 2026-01-17*

