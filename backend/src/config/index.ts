import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Application Configuration
 * All configuration values are loaded from environment variables
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://betterme:betterme@localhost:5432/betterme?schema=public',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'master-trainer-jwt-secret-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // AI API Configuration - Supports Aliyun Bailian (DashScope) models
  // AI API配置 - 支持阿里云百炼（DashScope）大模型
  ai: {
    // Base URL for Aliyun Bailian DashScope (OpenAI compatible mode)
    // 阿里云百炼 DashScope 基础URL（OpenAI兼容模式）
    baseUrl: process.env.AI_API_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    // API Key from Aliyun Bailian console
    // 从阿里云百炼控制台获取的API Key
    apiKey: process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY || '',
    // Default model for text chat / 默认文本对话模型
    defaultModel: process.env.AI_DEFAULT_MODEL || 'qwen-plus',
    // Default TTS model / 默认TTS语音合成模型
    defaultTTSModel: process.env.AI_DEFAULT_TTS_MODEL || 'cosyvoice-v1',
    // Default STT model (Voice to Text / ASR) / 默认STT语音转文字模型
    defaultSTTModel: process.env.AI_DEFAULT_STT_MODEL || 'qwen3-asr-flash-realtime',
    // Default embedding model / 默认向量模型
    defaultEmbeddingModel: process.env.AI_DEFAULT_EMBEDDING_MODEL || 'text-embedding-v3',
    timeout: parseInt(process.env.AI_TIMEOUT || '60000', 10),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  },

  // Frontend URL (for CORS)
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'master-trainer-session-secret-2026',
    maxAge: 30 * 60 * 1000, // 30 minutes
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // Limit each IP to 500 requests per windowMs
  },

  // Roleplay Configuration
  roleplay: {
    maxTurns: 8,
    minMessageLength: 10,
    maxMessageLength: 2000,
  },
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Using default values for missing configuration.');
  }

  if (!config.ai.apiKey) {
    console.warn('Warning: AI_API_KEY is not set. AI features will not work.');
  }
}

export default config;

