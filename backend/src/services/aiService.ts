import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * AI Service - Supports multiple AI models via unified API
 * Based on API documentation: https://gpt-best.apifox.cn/doc-3530850
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

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

interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

// Available AI Models (can be extended from database)
const DEFAULT_AI_MODELS: AIModelInfo[] = [
  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable GPT-4 model' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Smaller, faster GPT-4 model' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'GPT-4 with improved performance' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and cost-effective' },
  
  // Anthropic Models
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most powerful Claude model' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and speed' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast and compact' },
  
  // Alibaba Models
  { id: 'qwen-max', name: 'Qwen Max', provider: 'Alibaba', description: 'Alibaba\'s most capable model' },
  { id: 'qwen-plus', name: 'Qwen Plus', provider: 'Alibaba', description: 'Enhanced Qwen model' },
  { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'Alibaba', description: 'Fast Qwen model' },
  
  // DeepSeek Models
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', description: 'General chat model' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', description: 'Code-specialized model' },
];

class AIService {
  private client: AxiosInstance;
  private models: AIModelInfo[] = DEFAULT_AI_MODELS;

  constructor() {
    this.client = axios.create({
      baseURL: config.ai.baseUrl,
      timeout: config.ai.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ai.apiKey}`,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (req) => {
        logger.debug('AI API Request', {
          url: req.url,
          model: (req.data as ChatCompletionRequest)?.model,
        });
        return req;
      },
      (error) => {
        logger.error('AI API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (res) => {
        logger.debug('AI API Response', {
          status: res.status,
          model: res.data?.model,
          usage: res.data?.usage,
        });
        return res;
      },
      (error: AxiosError) => {
        logger.error('AI API Response Error', {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get list of available AI models
   */
  getAvailableModels(): AIModelInfo[] {
    return this.models;
  }

  /**
   * Set custom models list (from database)
   */
  setModels(models: AIModelInfo[]): void {
    this.models = models;
  }

  /**
   * Chat completion - Main method for AI conversations
   * @param messages - Array of chat messages
   * @param options - Optional configuration
   */
  async chatCompletion(
    messages: ChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const model = options?.model || config.ai.defaultModel;
    const temperature = options?.temperature ?? config.ai.temperature;
    const maxTokens = options?.maxTokens ?? config.ai.maxTokens;

    try {
      const request: ChatCompletionRequest = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      };

      const response = await this.client.post<ChatCompletionResponse>(
        '/chat/completions',
        request
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        logger.error('AI Chat Completion Failed', { error: message, model });
        throw new Error(`AI service error: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Generate buyer response in roleplay scenario
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
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      return JSON.parse(jsonStr);
    } catch {
      logger.error('Failed to parse feedback JSON', { response });
      throw new Error('Failed to generate valid feedback');
    }
  }

  /**
   * Generate follow-up email based on conversation
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
      logger.error('Failed to parse email JSON', { response });
      throw new Error('Failed to generate valid email');
    }
  }

  /**
   * Test AI connection
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
   * @param modelId - The model ID to test
   * @returns Object containing test result, response time, and error message if any
   */
  async testModelConnection(modelId: string): Promise<{
    success: boolean;
    responseTime: number;
    message: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      const response = await this.chatCompletion(
        [{ role: 'user', content: 'Hello, respond with "OK" only.' }],
        { model: modelId, maxTokens: 10 }
      );
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const isOk = response.toLowerCase().includes('ok');
      return {
        success: isOk,
        responseTime,
        message: isOk ? 'Model connection successful' : 'Model responded but unexpected response',
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Model connection test failed', { modelId, error: errorMessage });
      return {
        success: false,
        responseTime,
        message: 'Model connection failed',
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;

