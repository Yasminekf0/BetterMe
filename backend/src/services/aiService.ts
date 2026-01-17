import axios, { AxiosInstance, AxiosError } from 'axios';
import WebSocket from 'ws';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * AI Service - Supports Aliyun Bailian (DashScope) models
 * AI服务 - 支持阿里云百炼（DashScope）大模型
 * 
 * Supported model types / 支持的模型类型:
 * - CHAT: Text chat/conversation models (文本对话模型)
 * - TTS: Text-to-Speech models (文本转语音模型)  
 * - EMBEDDING: Vector/Embedding models (向量模型)
 * 
 * API Documentation / API文档: https://help.aliyun.com/zh/model-studio/
 */

// Model type enumeration / 模型类型枚举
export enum AIModelType {
  CHAT = 'CHAT',           // Text chat model / 文本对话模型
  TTS = 'TTS',             // Text-to-Speech model / 语音合成模型
  STT = 'STT',             // Speech-to-Text model / 语音转文字模型 (Voice to Text / ASR)
  EMBEDDING = 'EMBEDDING', // Embedding/Vector model / 向量模型
}

// Chat message interface / 聊天消息接口
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Chat completion request interface / 聊天完成请求接口
interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Chat completion response interface / 聊天完成响应接口
interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Embedding request interface / 向量请求接口
interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: 'float' | 'base64';
}

// Embedding response interface / 向量响应接口
interface EmbeddingResponse {
  object: string;
  data: {
    object: string;
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// TTS request interface / TTS请求接口
interface TTSRequest {
  model: string;
  input: string;
  voice?: string;
  response_format?: 'mp3' | 'wav' | 'pcm';
  speed?: number;
}

// STT (Speech-to-Text) request interface / STT（语音转文字）请求接口
interface STTRequest {
  model: string;
  audioData: Buffer;
  format?: 'pcm' | 'opus' | 'wav';
  sampleRate?: number;
  language?: string;
}

// STT response interface / STT响应接口
interface STTResponse {
  text: string;
  partial?: boolean;
  duration?: number;
}

// STT session configuration / STT会话配置接口
interface STTSessionConfig {
  input_audio_format: string;
  sample_rate: number;
  language: string;
  enable_input_audio_transcription: boolean;
}

// AI Model info interface / AI模型信息接口
interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  type?: AIModelType;
}

// Aliyun Bailian API endpoints configuration
// 阿里云百炼API端点配置
const API_ENDPOINTS = {
  // OpenAI compatible mode endpoints / OpenAI兼容模式端点
  CHAT: '/chat/completions',           // Text chat / 文本对话
  EMBEDDING: '/embeddings',            // Vector embedding / 向量嵌入
  TTS: '/audio/speech',                // Text to speech / 文本转语音
  // STT uses WebSocket endpoint / STT使用WebSocket端点
  STT_WS_BASE: 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime',  // Speech to text WebSocket / 语音转文字WebSocket
};

// Default available AI models for Aliyun Bailian
// 阿里云百炼默认可用模型列表
const DEFAULT_AI_MODELS: AIModelInfo[] = [
  // Aliyun Qwen Chat Models / 阿里云通义千问对话模型
  { id: 'qwen-max', name: '通义千问Max', provider: 'Alibaba', description: 'Qwen最强大的对话模型 / Most powerful Qwen model', type: AIModelType.CHAT },
  { id: 'qwen-max-latest', name: '通义千问Max最新版', provider: 'Alibaba', description: 'Qwen Max最新版本 / Latest Qwen Max version', type: AIModelType.CHAT },
  { id: 'qwen-plus', name: '通义千问Plus', provider: 'Alibaba', description: '平衡性能和成本 / Balanced performance and cost', type: AIModelType.CHAT },
  { id: 'qwen-plus-latest', name: '通义千问Plus最新版', provider: 'Alibaba', description: 'Qwen Plus最新版本 / Latest Qwen Plus version', type: AIModelType.CHAT },
  { id: 'qwen-turbo', name: '通义千问Turbo', provider: 'Alibaba', description: '快速响应模型 / Fast response model', type: AIModelType.CHAT },
  { id: 'qwen-turbo-latest', name: '通义千问Turbo最新版', provider: 'Alibaba', description: 'Qwen Turbo最新版本 / Latest Qwen Turbo version', type: AIModelType.CHAT },
  { id: 'qwen-long', name: '通义千问Long', provider: 'Alibaba', description: '长文本对话模型 / Long context model', type: AIModelType.CHAT },
  
  // Aliyun Qwen VL (Vision-Language) Models / 通义千问视觉语言模型
  { id: 'qwen-vl-max', name: '通义千问VL Max', provider: 'Alibaba', description: '视觉语言最强模型 / Most powerful vision-language model', type: AIModelType.CHAT },
  { id: 'qwen-vl-plus', name: '通义千问VL Plus', provider: 'Alibaba', description: '视觉语言平衡模型 / Balanced vision-language model', type: AIModelType.CHAT },
  
  // Aliyun Embedding Models / 阿里云向量模型
  { id: 'text-embedding-v3', name: '文本向量V3', provider: 'Alibaba', description: '最新版文本向量模型 / Latest text embedding model', type: AIModelType.EMBEDDING },
  { id: 'text-embedding-v2', name: '文本向量V2', provider: 'Alibaba', description: '文本向量模型V2 / Text embedding model V2', type: AIModelType.EMBEDDING },
  { id: 'text-embedding-v1', name: '文本向量V1', provider: 'Alibaba', description: '文本向量模型V1 / Text embedding model V1', type: AIModelType.EMBEDDING },
  
  // Aliyun TTS Models / 阿里云语音合成模型
  { id: 'cosyvoice-v1', name: 'CosyVoice V1', provider: 'Alibaba', description: '高质量语音合成 / High quality TTS', type: AIModelType.TTS },
  { id: 'sambert-zhichu-v1', name: 'Sambert知楚', provider: 'Alibaba', description: '中文语音合成 / Chinese TTS', type: AIModelType.TTS },
  { id: 'sambert-zhimiao-emo-v1', name: 'Sambert知妙情感版', provider: 'Alibaba', description: '情感语音合成 / Emotional TTS', type: AIModelType.TTS },
  
  // Aliyun STT (ASR) Models / 阿里云语音识别模型 (Voice to Text)
  { id: 'qwen3-asr-flash-realtime', name: 'Qwen3 ASR Flash Realtime', provider: 'Alibaba', description: '实时语音转文字，低延迟 / Real-time speech to text, low latency', type: AIModelType.STT },
  { id: 'qwen2.5-asr-turbo-realtime', name: 'Qwen2.5 ASR Turbo Realtime', provider: 'Alibaba', description: '快速语音转文字 / Fast speech to text', type: AIModelType.STT },
];

// Model-specific API configuration interface
// 模型特定API配置接口
interface ModelAPIConfig {
  apiEndpoint?: string | null;
  apiKey?: string | null;
}

/**
 * AIService class - Manages AI model interactions
 * AIService类 - 管理AI模型交互
 * 
 * Supports multiple AI providers with custom API endpoints and keys
 * 支持多个AI提供商，可自定义API端点和密钥
 */
class AIService {
  private client: AxiosInstance;
  private models: AIModelInfo[] = DEFAULT_AI_MODELS;

  constructor() {
    // Initialize default axios client with global config
    // 使用全局配置初始化默认axios客户端
    this.client = this.createClient();
  }

  /**
   * Create axios client with specific or default config
   * 使用特定或默认配置创建axios客户端
   * @param apiConfig - Optional model-specific API configuration / 可选的模型特定API配置
   * @returns Configured axios instance / 配置好的axios实例
   */
  private createClient(apiConfig?: ModelAPIConfig): AxiosInstance {
    // Use model-specific config if provided, otherwise use global config
    // 如果提供了模型特定配置则使用，否则使用全局配置
    const baseURL = apiConfig?.apiEndpoint || config.ai.baseUrl;
    const apiKey = apiConfig?.apiKey || config.ai.apiKey;

    const client = axios.create({
      baseURL,
      timeout: config.ai.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    // Add request interceptor for logging / 添加请求拦截器用于日志记录
    client.interceptors.request.use(
      (req) => {
        logger.debug('AI API Request / AI API请求', {
          url: req.url,
          baseURL: req.baseURL,
          model: (req.data as ChatCompletionRequest)?.model,
        });
        return req;
      },
      (error) => {
        logger.error('AI API Request Error / AI API请求错误', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging / 添加响应拦截器用于日志记录
    client.interceptors.response.use(
      (res) => {
        logger.debug('AI API Response / AI API响应', {
          status: res.status,
          model: res.data?.model,
          usage: res.data?.usage,
        });
        return res;
      },
      (error: AxiosError) => {
        logger.error('AI API Response Error / AI API响应错误', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Get client for specific model configuration
   * 获取特定模型配置的客户端
   * @param apiConfig - Model-specific API configuration / 模型特定API配置
   * @returns Axios instance with proper configuration / 配置正确的axios实例
   */
  getClientForModel(apiConfig?: ModelAPIConfig): AxiosInstance {
    // If model has custom API config, create new client; otherwise use default
    // 如果模型有自定义API配置，创建新客户端；否则使用默认客户端
    if (apiConfig?.apiEndpoint || apiConfig?.apiKey) {
      return this.createClient(apiConfig);
    }
    return this.client;
  }

  /**
   * Get API endpoint based on model type
   * 根据模型类型获取API端点
   * @param modelType - The type of AI model / 模型类型
   * @returns The API endpoint path / API端点路径
   */
  getEndpointForModelType(modelType: AIModelType): string {
    switch (modelType) {
      case AIModelType.CHAT:
        return API_ENDPOINTS.CHAT;
      case AIModelType.TTS:
        return API_ENDPOINTS.TTS;
      case AIModelType.STT:
        return API_ENDPOINTS.STT_WS_BASE;
      case AIModelType.EMBEDDING:
        return API_ENDPOINTS.EMBEDDING;
      default:
        return API_ENDPOINTS.CHAT;
    }
  }

  /**
   * Detect model type from model ID
   * 从模型ID检测模型类型
   * @param modelId - The model identifier / 模型标识符
   * @returns The detected model type / 检测到的模型类型
   */
  detectModelType(modelId: string): AIModelType {
    const lowerModelId = modelId.toLowerCase();
    
    // Check for STT/ASR models (Voice to Text) / 检查STT/ASR模型（语音转文字）
    if (lowerModelId.includes('asr') || 
        lowerModelId.includes('stt') ||
        lowerModelId.includes('speech-to-text') ||
        lowerModelId.includes('voice-to-text')) {
      return AIModelType.STT;
    }
    
    // Check for TTS models / 检查TTS模型
    if (lowerModelId.includes('cosyvoice') || 
        lowerModelId.includes('sambert') || 
        lowerModelId.includes('tts')) {
      return AIModelType.TTS;
    }
    
    // Check for Embedding models / 检查向量模型
    if (lowerModelId.includes('embedding') || 
        lowerModelId.includes('vector')) {
      return AIModelType.EMBEDDING;
    }
    
    // Default to CHAT / 默认为对话模型
    return AIModelType.CHAT;
  }

  /**
   * Get list of available AI models
   * 获取可用AI模型列表
   */
  getAvailableModels(): AIModelInfo[] {
    return this.models;
  }

  /**
   * Get models by type
   * 按类型获取模型列表
   * @param type - The model type to filter by / 要筛选的模型类型
   */
  getModelsByType(type: AIModelType): AIModelInfo[] {
    return this.models.filter(m => m.type === type);
  }

  /**
   * Set custom models list (from database)
   * 设置自定义模型列表（从数据库）
   */
  setModels(models: AIModelInfo[]): void {
    this.models = models;
  }

  /**
   * Chat completion - Main method for AI conversations
   * 聊天完成 - AI对话的主要方法
   * @param messages - Array of chat messages / 聊天消息数组
   * @param options - Optional configuration including model-specific API config / 可选配置，包括模型特定的API配置
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      // Model-specific API configuration / 模型特定API配置
      apiEndpoint?: string | null;
      apiKey?: string | null;
    }
  ): Promise<string> {
    const model = options?.model || config.ai.defaultModel;
    const temperature = options?.temperature ?? config.ai.temperature;
    const maxTokens = options?.maxTokens ?? config.ai.maxTokens;

    // Get client with model-specific config or default / 获取模型特定配置或默认的客户端
    const client = this.getClientForModel({
      apiEndpoint: options?.apiEndpoint,
      apiKey: options?.apiKey,
    });

    try {
      const request: ChatCompletionRequest = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      };

      // Use OpenAI compatible endpoint for chat
      // 使用OpenAI兼容端点进行对话
      const response = await client.post<ChatCompletionResponse>(
        API_ENDPOINTS.CHAT,
        request
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI / AI返回空响应');
      }

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        logger.error('AI Chat Completion Failed / AI对话完成失败', { error: message, model });
        throw new Error(`AI service error / AI服务错误: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Generate text embedding/vector
   * 生成文本向量
   * @param input - Text or array of texts to embed / 要向量化的文本或文本数组
   * @param model - Optional model to use / 可选使用的模型
   * @param apiConfig - Optional model-specific API configuration / 可选的模型特定API配置
   */
  async generateEmbedding(
    input: string | string[],
    model?: string,
    apiConfig?: ModelAPIConfig
  ): Promise<number[] | number[][]> {
    const embeddingModel = model || config.ai.defaultEmbeddingModel;

    // Get client with model-specific config or default / 获取模型特定配置或默认的客户端
    const client = this.getClientForModel(apiConfig);

    try {
      const request: EmbeddingRequest = {
        model: embeddingModel,
        input,
        encoding_format: 'float',
      };

      // Use OpenAI compatible endpoint for embedding
      // 使用OpenAI兼容端点进行向量化
      const response = await client.post<EmbeddingResponse>(
        API_ENDPOINTS.EMBEDDING,
        request
      );

      if (Array.isArray(input)) {
        return response.data.data.map(d => d.embedding);
      }
      return response.data.data[0]?.embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        logger.error('AI Embedding Failed / AI向量化失败', { error: message, model: embeddingModel });
        throw new Error(`AI embedding error / AI向量化错误: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Generate speech from text (TTS)
   * 从文本生成语音（TTS）
   * @param text - Text to convert to speech / 要转换为语音的文本
   * @param options - TTS options including model-specific API config / TTS选项，包括模型特定API配置
   */
  async textToSpeech(
    text: string,
    options?: {
      model?: string;
      voice?: string;
      format?: 'mp3' | 'wav' | 'pcm';
      speed?: number;
      // Model-specific API configuration / 模型特定API配置
      apiEndpoint?: string | null;
      apiKey?: string | null;
    }
  ): Promise<Buffer> {
    const ttsModel = options?.model || config.ai.defaultTTSModel;

    // Get client with model-specific config or default / 获取模型特定配置或默认的客户端
    const client = this.getClientForModel({
      apiEndpoint: options?.apiEndpoint,
      apiKey: options?.apiKey,
    });

    try {
      const request: TTSRequest = {
        model: ttsModel,
        input: text,
        voice: options?.voice || 'alloy',
        response_format: options?.format || 'mp3',
        speed: options?.speed || 1.0,
      };

      // Use OpenAI compatible endpoint for TTS
      // 使用OpenAI兼容端点进行语音合成
      const response = await client.post(
        API_ENDPOINTS.TTS,
        request,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        logger.error('AI TTS Failed / AI语音合成失败', { error: message, model: ttsModel });
        throw new Error(`AI TTS error / AI语音合成错误: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Speech to Text (STT) - Convert audio to text using WebSocket
   * 语音转文字（STT）- 使用WebSocket将音频转换为文字
   * 
   * Uses Aliyun Bailian qwen3-asr-flash-realtime model
   * 使用阿里云百炼 qwen3-asr-flash-realtime 模型
   * 
   * @param audioData - Audio buffer data / 音频缓冲数据
   * @param options - STT options including model-specific API config / STT选项，包括模型特定API配置
   * @returns Promise with transcribed text / 返回转录文字的Promise
   */
  async speechToText(
    audioData: Buffer,
    options?: {
      model?: string;
      format?: 'pcm' | 'opus' | 'wav';
      sampleRate?: number;
      language?: string;
      // Model-specific API configuration / 模型特定API配置
      apiEndpoint?: string | null;
      apiKey?: string | null;
    }
  ): Promise<STTResponse> {
    const sttModel = options?.model || config.ai.defaultSTTModel;
    const apiKey = options?.apiKey || config.ai.apiKey;
    const format = options?.format || 'pcm';
    const sampleRate = options?.sampleRate || 16000;
    const language = options?.language || 'zh';

    // Construct WebSocket URL with model parameter
    // 构建带模型参数的WebSocket URL
    const wsBaseUrl = options?.apiEndpoint || API_ENDPOINTS.STT_WS_BASE;
    const wsUrl = `${wsBaseUrl}?model=${sttModel}`;

    return new Promise((resolve, reject) => {
      let transcribedText = '';
      let isCompleted = false;

      try {
        // Create WebSocket connection with authentication
        // 创建带身份验证的WebSocket连接
        const ws = new WebSocket(wsUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        // Connection timeout / 连接超时
        const connectionTimeout = setTimeout(() => {
          if (!isCompleted) {
            ws.close();
            reject(new Error('STT WebSocket connection timeout / STT WebSocket连接超时'));
          }
        }, config.ai.timeout);

        ws.on('open', () => {
          logger.debug('STT WebSocket connected / STT WebSocket已连接', { model: sttModel });

          // Send session configuration / 发送会话配置
          const sessionConfig: STTSessionConfig = {
            input_audio_format: format,
            sample_rate: sampleRate,
            language: language,
            enable_input_audio_transcription: true
          };

          ws.send(JSON.stringify({
            event_id: `session_update_${Date.now()}`,
            type: 'session.update',
            session: sessionConfig
          }));

          // Send audio data in chunks / 分块发送音频数据
          const chunkSize = 3200; // Approximately 0.2 seconds of audio at 16kHz / 约0.2秒的音频（16kHz采样率）
          let offset = 0;

          const sendChunk = () => {
            if (offset < audioData.length && ws.readyState === WebSocket.OPEN) {
              const chunk = audioData.slice(offset, offset + chunkSize);
              ws.send(chunk);
              offset += chunkSize;
              // Small delay between chunks / 块之间的小延迟
              setTimeout(sendChunk, 20);
            } else if (offset >= audioData.length && ws.readyState === WebSocket.OPEN) {
              // Send silence to trigger VAD end / 发送静音以触发VAD结束
              const silence = Buffer.alloc(chunkSize, 0);
              for (let i = 0; i < 5; i++) {
                ws.send(silence);
              }
            }
          };

          sendChunk();
        });

        ws.on('message', (data: WebSocket.Data) => {
          try {
            const msg = JSON.parse(data.toString());
            logger.debug('STT WebSocket message / STT WebSocket消息', { type: msg.type });

            // Handle different message types / 处理不同消息类型
            if (msg.type === 'transcript.partial') {
              // Partial transcription result / 部分转录结果
              logger.debug('Partial transcript / 部分转录', { text: msg.transcript });
            } else if (msg.type === 'transcript.final' || msg.type === 'response.done') {
              // Final transcription result / 最终转录结果
              transcribedText = msg.transcript || msg.text || '';
              isCompleted = true;
              clearTimeout(connectionTimeout);
              ws.close();
              resolve({
                text: transcribedText,
                partial: false,
                duration: msg.duration
              });
            } else if (msg.type === 'error') {
              // Error from server / 服务器错误
              isCompleted = true;
              clearTimeout(connectionTimeout);
              ws.close();
              reject(new Error(`STT error / STT错误: ${msg.error?.message || 'Unknown error'}`));
            } else if (msg.type === 'session.created' || msg.type === 'session.updated') {
              // Session events / 会话事件
              logger.debug('STT session event / STT会话事件', { type: msg.type });
            }
          } catch (parseError) {
            // Non-JSON message (possibly binary) / 非JSON消息（可能是二进制）
            logger.debug('STT received non-JSON message / STT收到非JSON消息');
          }
        });

        ws.on('error', (error: Error) => {
          logger.error('STT WebSocket error / STT WebSocket错误', { error: error.message, model: sttModel });
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(connectionTimeout);
            reject(new Error(`STT WebSocket error / STT WebSocket错误: ${error.message}`));
          }
        });

        ws.on('close', (code: number, reason: Buffer) => {
          logger.debug('STT WebSocket closed / STT WebSocket已关闭', { code, reason: reason.toString() });
          clearTimeout(connectionTimeout);
          if (!isCompleted) {
            isCompleted = true;
            // If closed without final result, return partial text or empty
            // 如果没有最终结果就关闭，返回部分文本或空
            resolve({
              text: transcribedText,
              partial: true
            });
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred / 发生未知错误';
        logger.error('STT initialization failed / STT初始化失败', { error: errorMessage, model: sttModel });
        reject(new Error(`STT error / STT错误: ${errorMessage}`));
      }
    });
  }

  /**
   * Get STT WebSocket URL for direct client connection
   * 获取STT WebSocket URL供客户端直接连接
   * 
   * @param model - STT model ID / STT模型ID
   * @param apiConfig - Optional API configuration / 可选API配置
   * @returns WebSocket URL and headers for client connection / 客户端连接的WebSocket URL和请求头
   */
  getSTTWebSocketConfig(
    model?: string,
    apiConfig?: ModelAPIConfig
  ): {
    url: string;
    headers: { Authorization: string; 'OpenAI-Beta': string };
    sessionConfig: STTSessionConfig;
  } {
    const sttModel = model || config.ai.defaultSTTModel;
    const apiKey = apiConfig?.apiKey || config.ai.apiKey;
    // For STT models, always use WebSocket endpoint, ignore HTTP apiEndpoint
    // 对于STT模型，始终使用WebSocket端点，忽略HTTP的apiEndpoint
    const wsBaseUrl = API_ENDPOINTS.STT_WS_BASE;

    return {
      url: `${wsBaseUrl}?model=${sttModel}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      },
      sessionConfig: {
        input_audio_format: 'pcm',
        sample_rate: 16000,
        language: 'zh',
        enable_input_audio_transcription: true
      }
    };
  }

  /**
   * Test STT WebSocket connection
   * 测试STT WebSocket连接
   * 
   * @param url - WebSocket URL / WebSocket地址
   * @param headers - Connection headers / 连接请求头
   * @returns Connection test result / 连接测试结果
   */
  private testSTTWebSocketConnection(
    url: string,
    headers: { Authorization: string; 'OpenAI-Beta': string }
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const timeout = 10000; // 10 seconds timeout / 10秒超时
      let isResolved = false;

      try {
        const ws = new WebSocket(url, { headers });

        // Connection timeout / 连接超时
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            ws.close();
            resolve({ success: false, error: 'Connection timeout / 连接超时' });
          }
        }, timeout);

        ws.on('open', () => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            logger.debug('STT WebSocket connection test successful / STT WebSocket连接测试成功');
            ws.close();
            resolve({ success: true });
          }
        });

        ws.on('error', (error: Error) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            logger.error('STT WebSocket connection test failed / STT WebSocket连接测试失败', { error: error.message });
            resolve({ success: false, error: error.message });
          }
        });

        ws.on('close', (code: number, reason: Buffer) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutId);
            // If closed before open event, it's a failure / 如果在open事件前关闭，则失败
            resolve({ 
              success: false, 
              error: `Connection closed: code=${code}, reason=${reason.toString() || 'No reason'}` 
            });
          }
        });
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          const errorMsg = error instanceof Error ? error.message : 'Failed to create WebSocket';
          resolve({ success: false, error: errorMsg });
        }
      }
    });
  }

  /**
   * Generate buyer response in roleplay scenario
   * 在角色扮演场景中生成买家响应
   */
  async generateBuyerResponse(
    scenarioContext: string,
    buyerPersona: string,
    conversationHistory: ChatMessage[],
    userMessage: string,
    model?: string
  ): Promise<string> {
    const systemPrompt = `You are playing the role of a potential enterprise customer in a sales roleplay training scenario.

SCENARIO CONTEXT:
${scenarioContext}

BUYER PERSONA:
${buyerPersona}

INSTRUCTIONS:
1. Stay in character as the buyer throughout the conversation
2. Express realistic objections, concerns, and questions
3. Respond naturally based on the buyer's personality and background
4. If the sales rep addresses concerns well, gradually become more receptive
5. If they don't address concerns adequately, remain skeptical
6. Keep responses concise (2-4 sentences typically)
7. Never break character or provide coaching feedback

Respond as the buyer to the sales rep's latest message.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    return this.chatCompletion(messages, { model });
  }

  /**
   * Generate feedback for a completed roleplay session
   * 为完成的角色扮演会话生成反馈
   */
  async generateFeedback(
    scenarioContext: string,
    idealResponses: string[],
    conversationHistory: ChatMessage[],
    model?: string
  ): Promise<{
    overallScore: number;
    dimensions: Array<{
      name: string;
      score: number;
      weight: number;
      quote: string;
      explanation: string;
      suggestions: string[];
    }>;
    summary: string;
    recommendations: string[];
  }> {
    const systemPrompt = `You are an expert sales coach evaluating a sales roleplay practice session.

SCENARIO CONTEXT:
${scenarioContext}

IDEAL RESPONSES (for reference):
${idealResponses.map((r, i) => `${i + 1}. ${r}`).join('\n')}

EVALUATION CRITERIA:
1. Value Articulation (35%): How well did they communicate the product/service value?
2. Objection Handling (35%): How effectively did they address customer concerns?
3. Technical Clarity (30%): How accurate and clear were their technical explanations?

INSTRUCTIONS:
Analyze the conversation and provide a structured evaluation in JSON format:
{
  "overallScore": <number 0-100>,
  "dimensions": [
    {
      "name": "Value Articulation",
      "score": <number 0-100>,
      "weight": 35,
      "quote": "<direct quote from user's response>",
      "explanation": "<brief analysis of performance>",
      "suggestions": ["<improvement suggestion 1>", "<suggestion 2>"]
    },
    {
      "name": "Objection Handling",
      "score": <number 0-100>,
      "weight": 35,
      "quote": "<direct quote>",
      "explanation": "<analysis>",
      "suggestions": ["<suggestion>"]
    },
    {
      "name": "Technical Clarity",
      "score": <number 0-100>,
      "weight": 30,
      "quote": "<direct quote>",
      "explanation": "<analysis>",
      "suggestions": ["<suggestion>"]
    }
  ],
  "summary": "<overall performance summary in 2-3 sentences>",
  "recommendations": ["<key recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Respond ONLY with valid JSON, no additional text.`;

    const conversationText = conversationHistory
      .map((m) => `${m.role === 'user' ? 'Sales Rep' : 'Buyer'}: ${m.content}`)
      .join('\n\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here is the conversation to evaluate:\n\n${conversationText}` },
    ];

    const response = await this.chatCompletion(messages, { model, temperature: 0.3 });
    
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      // 从响应中提取JSON（处理可能存在的markdown代码块）
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      return JSON.parse(jsonStr);
    } catch {
      logger.error('Failed to parse feedback JSON / 解析反馈JSON失败', { response });
      throw new Error('Failed to generate valid feedback / 生成有效反馈失败');
    }
  }

  /**
   * Generate follow-up email based on conversation
   * 基于对话生成跟进邮件
   */
  async generateFollowUpEmail(
    scenarioContext: string,
    buyerName: string,
    conversationHistory: ChatMessage[],
    userSignature: string,
    model?: string
  ): Promise<{ subject: string; body: string }> {
    const systemPrompt = `You are a professional sales email writer.

SCENARIO CONTEXT:
${scenarioContext}

BUYER NAME: ${buyerName}
USER SIGNATURE: ${userSignature}

INSTRUCTIONS:
Based on the sales conversation, generate a professional follow-up email that:
1. Thanks the customer for their time
2. Addresses specific concerns they raised
3. Provides additional value or information
4. Proposes clear next steps
5. Maintains a professional but friendly tone

Respond in JSON format:
{
  "subject": "<email subject line>",
  "body": "<full email body text>"
}

Respond ONLY with valid JSON, no additional text.`;

    const conversationText = conversationHistory
      .map((m) => `${m.role === 'user' ? 'Sales Rep' : 'Buyer'}: ${m.content}`)
      .join('\n\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a follow-up email based on this conversation:\n\n${conversationText}` },
    ];

    const response = await this.chatCompletion(messages, { model, temperature: 0.5 });
    
    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      return JSON.parse(jsonStr);
    } catch {
      logger.error('Failed to parse email JSON / 解析邮件JSON失败', { response });
      throw new Error('Failed to generate valid email / 生成有效邮件失败');
    }
  }

  /**
   * Test AI connection
   * 测试AI连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chatCompletion(
        [{ role: 'user', content: 'Hello, respond with "OK" only.' }],
        { maxTokens: 10 }
      );
      return response.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }

  /**
   * Test specific AI model connection
   * 测试特定AI模型连接
   * @param modelId - The model ID to test / 要测试的模型ID
   * @param modelType - Optional model type / 可选模型类型
   * @param apiConfig - Optional model-specific API configuration / 可选的模型特定API配置
   * @returns Object containing test result, response time, and error message if any
   */
  async testModelConnection(
    modelId: string,
    modelType?: AIModelType,
    apiConfig?: ModelAPIConfig
  ): Promise<{
    success: boolean;
    responseTime: number;
    message: string;
    error?: string;
  }> {
    const startTime = Date.now();
    const detectedType = modelType || this.detectModelType(modelId);

    try {
      switch (detectedType) {
        case AIModelType.CHAT: {
          // Test chat model with model-specific config / 使用模型特定配置测试对话模型
          const response = await this.chatCompletion(
            [{ role: 'user', content: 'Hello, respond with "OK" only.' }],
            { 
              model: modelId, 
              maxTokens: 10,
              apiEndpoint: apiConfig?.apiEndpoint,
              apiKey: apiConfig?.apiKey,
            }
          );
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const isOk = response.toLowerCase().includes('ok');
          return {
            success: isOk,
            responseTime,
            message: isOk 
              ? 'Chat model connection successful / 对话模型连接成功' 
              : 'Model responded but unexpected response / 模型响应但内容不符',
          };
        }

        case AIModelType.EMBEDDING: {
          // Test embedding model with model-specific config / 使用模型特定配置测试向量模型
          const embedding = await this.generateEmbedding('test', modelId, apiConfig);
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const isValid = Array.isArray(embedding) && embedding.length > 0;
          return {
            success: isValid,
            responseTime,
            message: isValid 
              ? 'Embedding model connection successful / 向量模型连接成功' 
              : 'Model responded but no embedding returned / 模型响应但未返回向量',
          };
        }

        case AIModelType.TTS: {
          // Test TTS model with model-specific config / 使用模型特定配置测试TTS模型
          const audio = await this.textToSpeech('Test', { 
            model: modelId,
            apiEndpoint: apiConfig?.apiEndpoint,
            apiKey: apiConfig?.apiKey,
          });
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const isValid = audio && audio.length > 0;
          return {
            success: isValid,
            responseTime,
            message: isValid 
              ? 'TTS model connection successful / TTS模型连接成功' 
              : 'Model responded but no audio returned / 模型响应但未返回音频',
          };
        }

        case AIModelType.STT: {
          // Test STT model by attempting WebSocket connection / 通过尝试WebSocket连接测试STT模型
          const wsConfig = this.getSTTWebSocketConfig(modelId, apiConfig);
          
          // Verify the configuration is valid / 验证配置有效
          if (!wsConfig.url || !wsConfig.headers.Authorization) {
            return {
              success: false,
              responseTime: Date.now() - startTime,
              message: 'STT model configuration invalid / STT模型配置无效',
              error: 'Missing URL or API key / 缺少URL或API密钥',
            };
          }

          // Perform actual WebSocket connection test / 执行实际的WebSocket连接测试
          try {
            const connectionResult = await this.testSTTWebSocketConnection(wsConfig.url, wsConfig.headers);
            const endTime = Date.now();
            return {
              success: connectionResult.success,
              responseTime: endTime - startTime,
              message: connectionResult.success 
                ? 'STT model connection successful / STT模型连接成功' 
                : 'STT model connection failed / STT模型连接失败',
              error: connectionResult.error,
            };
          } catch (wsError) {
            const endTime = Date.now();
            const errorMsg = wsError instanceof Error ? wsError.message : 'Unknown WebSocket error';
            return {
              success: false,
              responseTime: endTime - startTime,
              message: 'STT model connection failed / STT模型连接失败',
              error: errorMsg,
            };
          }
        }

        default: {
          return {
            success: false,
            responseTime: Date.now() - startTime,
            message: 'Unknown model type / 未知模型类型',
            error: `Unsupported model type: ${detectedType}`,
          };
        }
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred / 发生未知错误';
      logger.error('Model connection test failed / 模型连接测试失败', { modelId, modelType: detectedType, error: errorMessage });
      return {
        success: false,
        responseTime,
        message: 'Model connection failed / 模型连接失败',
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance / 导出单例实例
export const aiService = new AIService();
export default aiService;
