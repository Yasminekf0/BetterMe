import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// 从.env文件加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Application Configuration / 应用配置
 * All configuration values are loaded from environment variables
 * 所有配置值都从环境变量加载
 */
export const config = {
  // Server Configuration / 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database Configuration / 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'mysql://betterme:betterme@localhost:3306/betterme',
  },

  // JWT Configuration / JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'master-trainer-jwt-secret-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // AI API Configuration - Supports Aliyun Bailian (DashScope) models
  // AI API配置 - 支持阿里云百炼（DashScope）大模型
  // API Documentation: https://help.aliyun.com/zh/model-studio/get-api-key
  ai: {
    // Base URL for Aliyun Bailian DashScope (OpenAI compatible mode)
    // 阿里云百炼 DashScope 基础URL（OpenAI兼容模式）
    // China: https://dashscope.aliyuncs.com/compatible-mode/v1
    // International: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    baseUrl: process.env.AI_API_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    // API Key from Aliyun Bailian console
    // 从阿里云百炼控制台获取的API Key
    apiKey: process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY || '',
    // Default model for text chat / 默认文本对话模型
    // Options: qwen-max, qwen-plus, qwen-turbo, qwen-long
    defaultModel: process.env.AI_DEFAULT_MODEL || 'qwen-plus',
    // Default TTS model / 默认TTS语音合成模型
    // Options: cosyvoice-v1, sambert-zhichu-v1, sambert-zhimiao-emo-v1
    defaultTTSModel: process.env.AI_DEFAULT_TTS_MODEL || 'cosyvoice-v1',
    // Default STT model (Voice to Text / ASR) / 默认STT语音转文字模型
    // Options: qwen3-asr-flash-realtime, qwen2.5-asr-turbo-realtime
    defaultSTTModel: process.env.AI_DEFAULT_STT_MODEL || 'qwen3-asr-flash-realtime',
    // Default embedding model / 默认向量模型
    // Options: text-embedding-v3, text-embedding-v2, text-embedding-v1
    defaultEmbeddingModel: process.env.AI_DEFAULT_EMBEDDING_MODEL || 'text-embedding-v3',
    // Request timeout in milliseconds / 请求超时时间（毫秒）
    timeout: parseInt(process.env.AI_TIMEOUT || '60000', 10),
    // Maximum tokens for response / 响应最大Token数
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
    // Temperature for response randomness (0.0-1.0) / 响应随机性温度参数
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  },

  // Aliyun OSS Storage Configuration / 阿里云OSS存储配置
  // Documentation: https://help.aliyun.com/document_detail/31886.html
  oss: {
    // Access Key ID from Aliyun RAM console / 阿里云RAM控制台获取的Access Key ID
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    // Access Key Secret / 访问密钥
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    // OSS Region / OSS区域 (e.g., oss-cn-hangzhou)
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    // Bucket name / 存储桶名称
    bucket: process.env.OSS_BUCKET || '',
    // Endpoint / 端点 (e.g., oss-cn-hangzhou.aliyuncs.com)
    endpoint: process.env.OSS_ENDPOINT || 'oss-cn-hangzhou.aliyuncs.com',
    // Base URL for CDN or custom domain (optional) / CDN或自定义域名基础URL（可选）
    baseUrl: process.env.OSS_BASE_URL || '',
  },

  // Frontend URL (for CORS) / 前端URL（用于CORS）
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Session Configuration / 会话配置
  session: {
    secret: process.env.SESSION_SECRET || 'master-trainer-session-secret-2026',
    maxAge: 30 * 60 * 1000, // 30 minutes
  },

  // Rate Limiting / 速率限制
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // Limit each IP to 500 requests per windowMs
  },

  // Roleplay Configuration / 角色扮演配置
  roleplay: {
    maxTurns: 8,
    minMessageLength: 10,
    maxMessageLength: 2000,
  },
};

/**
 * Validate required configuration / 验证必需的配置
 */
export function validateConfig(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables / 警告: 缺少环境变量: ${missingVars.join(', ')}`);
    console.warn('Using default values for missing configuration. / 使用默认值替代缺失的配置。');
  }

  // Validate AI configuration / 验证AI配置
  if (!config.ai.apiKey) {
    console.warn('Warning: DASHSCOPE_API_KEY is not set. AI features will not work.');
    console.warn('警告: DASHSCOPE_API_KEY 未设置。AI功能将无法使用。');
  }

  // Validate OSS configuration (optional) / 验证OSS配置（可选）
  if (config.oss.accessKeyId && !config.oss.accessKeySecret) {
    console.warn('Warning: OSS_ACCESS_KEY_ID is set but OSS_ACCESS_KEY_SECRET is missing.');
    console.warn('警告: 设置了 OSS_ACCESS_KEY_ID 但缺少 OSS_ACCESS_KEY_SECRET。');
  }

  if (config.oss.accessKeyId && config.oss.accessKeySecret && !config.oss.bucket) {
    console.warn('Warning: OSS credentials are set but OSS_BUCKET is missing.');
    console.warn('警告: 设置了 OSS 凭证但缺少 OSS_BUCKET。');
  }
}

export default config;

