import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import settingsService from '../services/settingsService';
import operationLogService, { OperationType, TargetType } from '../services/operationLogService';
import { aiService, AIModelType } from '../services/aiService';

/**
 * Admin Controller
 * Handles admin-only operations: settings, logs, personas, AI models
 */

// ==================== System Settings ====================

/**
 * Get All System Settings
 * GET /api/admin/settings
 */
export async function getSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const settings = await settingsService.getAllSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Get settings error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
    });
  }
}

/**
 * Get Settings by Category
 * GET /api/admin/settings/:category
 */
export async function getSettingsByCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { category } = req.params;
    const settings = await settingsService.getSettingsByCategory(category);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Get settings by category error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get settings',
    });
  }
}

/**
 * Update System Settings
 * PUT /api/admin/settings
 */
export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Settings object is required',
      });
      return;
    }

    const result = await settingsService.bulkUpdateSettings(settings);

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      description: `Updated ${result.updated} system settings`,
      details: { settingKeys: Object.keys(settings) },
      req,
    });

    res.json({
      success: true,
      message: `Updated ${result.updated} settings`,
      data: await settingsService.getAllSettings(),
    });
  } catch (error) {
    logger.error('Update settings error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
    });
  }
}

/**
 * Reset Settings to Defaults
 * POST /api/admin/settings/reset
 */
export async function resetSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    await settingsService.resetToDefaults();

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      description: 'Reset all system settings to defaults',
      req,
    });

    res.json({
      success: true,
      message: 'Settings reset to defaults',
      data: await settingsService.getAllSettings(),
    });
  } catch (error) {
    logger.error('Reset settings error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings',
    });
  }
}

// ==================== Operation Logs ====================

/**
 * Get Operation Logs
 * GET /api/admin/logs
 */
export async function getOperationLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      pageSize = '20',
      userId,
      operationType,
      targetType,
      startDate,
      endDate,
    } = req.query;

    const result = await operationLogService.getOperationLogs({
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
      userId: userId as string,
      operationType: operationType as string,
      targetType: targetType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get operation logs error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get operation logs',
    });
  }
}

// ==================== Buyer Persona Templates ====================

/**
 * Get All Buyer Persona Templates
 * GET /api/admin/personas
 */
export async function getPersonaTemplates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page = '1', pageSize = '20', category, isActive } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [templates, total] = await Promise.all([
      prisma.buyerPersonaTemplate.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        include: {
          createdBy: {
            select: { name: true },
          },
        },
      }),
      prisma.buyerPersonaTemplate.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: templates,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Get persona templates error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get persona templates',
    });
  }
}

/**
 * Create Buyer Persona Template
 * POST /api/admin/personas
 */
export async function createPersonaTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, role, company, background, concerns, personality, category, isDefault } = req.body;

    if (!name || !role || !company || !background || !personality || !category) {
      res.status(400).json({
        success: false,
        error: 'Name, role, company, background, personality, and category are required',
      });
      return;
    }

    const template = await prisma.buyerPersonaTemplate.create({
      data: {
        name,
        role,
        company,
        background,
        concerns: concerns || [],
        personality,
        category,
        isDefault: isDefault || false,
        createdById: req.user!.id,
      },
    });

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.PERSONA_TEMPLATE,
      targetId: template.id,
      description: `Created buyer persona template: ${name}`,
      req,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Create persona template error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create persona template',
    });
  }
}

/**
 * Update Buyer Persona Template
 * PUT /api/admin/personas/:id
 */
export async function updatePersonaTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdById;
    delete updateData.createdAt;

    const template = await prisma.buyerPersonaTemplate.update({
      where: { id },
      data: updateData,
    });

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.PERSONA_TEMPLATE,
      targetId: id,
      description: `Updated buyer persona template: ${template.name}`,
      req,
    });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Update persona template error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update persona template',
    });
  }
}

/**
 * Delete Buyer Persona Template
 * DELETE /api/admin/personas/:id
 */
export async function deletePersonaTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const template = await prisma.buyerPersonaTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Persona template not found',
      });
      return;
    }

    if (template.isDefault) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete default persona template',
      });
      return;
    }

    await prisma.buyerPersonaTemplate.delete({
      where: { id },
    });

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.PERSONA_TEMPLATE,
      targetId: id,
      description: `Deleted buyer persona template: ${template.name}`,
      req,
    });

    res.json({
      success: true,
      message: 'Persona template deleted',
    });
  } catch (error) {
    logger.error('Delete persona template error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete persona template',
    });
  }
}

// ==================== AI Model Management ====================

/**
 * Get All AI Models
 * 获取所有AI模型
 * GET /api/admin/ai-models
 */
export async function getAIModels(req: AuthRequest, res: Response): Promise<void> {
  try {
    const models = await prisma.aIModel.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    // Mask API keys for security / 为安全起见遮蔽API密钥
    const maskedModels = models.map(model => ({
      ...model,
      apiKey: model.apiKey ? `${model.apiKey.substring(0, 8)}****` : null,
    }));

    res.json({
      success: true,
      data: maskedModels,
    });
  } catch (error) {
    logger.error('Get AI models error / 获取AI模型错误', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get AI models / 获取AI模型失败',
    });
  }
}

/**
 * Create AI Model
 * 创建AI模型
 * POST /api/admin/ai-models
 * 
 * Supports multiple AI providers / 支持多个AI提供商:
 * - OpenAI, Anthropic, DeepSeek, Alibaba (Qwen), etc.
 * 
 * Supports model types / 支持的模型类型:
 * - CHAT: Text chat models (文本对话模型)
 * - TTS: Text-to-Speech models (语音合成模型)
 * - EMBEDDING: Vector/Embedding models (向量模型)
 */
export async function createAIModel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { modelId, name, provider, description, isDefault, config, modelType, apiEndpoint, apiKey } = req.body;

    // Validate required fields / 验证必填字段
    if (!modelId || !name || !provider) {
      res.status(400).json({
        success: false,
        error: 'Model ID, name, and provider are required / 模型ID、名称和提供商是必填项',
      });
      return;
    }

    // Validate model type if provided / 验证模型类型（如果提供）
    const validModelTypes = Object.values(AIModelType);
    if (modelType && !validModelTypes.includes(modelType)) {
      res.status(400).json({
        success: false,
        error: `Invalid model type. Must be one of: ${validModelTypes.join(', ')} / 无效的模型类型，必须是以下之一: ${validModelTypes.join(', ')}`,
      });
      return;
    }

    // Auto-detect model type from modelId if not provided
    // 如果未提供，从modelId自动检测模型类型
    const detectedType = modelType || aiService.detectModelType(modelId);

    // If setting as default, unset other defaults
    // 如果设置为默认，取消其他默认设置
    if (isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.create({
      data: {
        modelId,
        name,
        provider,
        description,
        // API Endpoint - API接口地址 (optional, falls back to global config if not set)
        // API接口地址（可选，未设置时使用全局配置）
        apiEndpoint: apiEndpoint || null,
        // API Key - API密钥 (optional, falls back to global config if not set)
        // API密钥（可选，未设置时使用全局配置）
        apiKey: apiKey || null,
        isDefault: isDefault || false,
        config: {
          ...((config as object) || {}),
          modelType: detectedType,
          // Store endpoint type for routing / 存储端点类型用于路由
          endpointType: aiService.getEndpointForModelType(detectedType as AIModelType),
        },
      },
    });

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.AI_MODEL,
      targetId: model.id,
      description: `Created AI model / 创建AI模型: ${name} (${detectedType})`,
      req,
    });

    // Return response without exposing full API key / 返回响应时不暴露完整API Key
    res.status(201).json({
      success: true,
      data: {
        ...model,
        // Mask API key for security / 为安全起见遮蔽API Key
        apiKey: model.apiKey ? `${model.apiKey.substring(0, 8)}****` : null,
      },
    });
  } catch (error) {
    logger.error('Create AI model error / 创建AI模型错误', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create AI model / 创建AI模型失败',
    });
  }
}

/**
 * Update AI Model
 * 更新AI模型
 * PUT /api/admin/ai-models/:id
 */
export async function updateAIModel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, provider, description, isDefault, isActive, config, apiEndpoint, apiKey } = req.body;

    // If setting as default, unset other defaults
    // 如果设置为默认，取消其他默认设置
    if (isDefault) {
      await prisma.aIModel.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const model = await prisma.aIModel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(provider !== undefined && { provider }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(config !== undefined && { config }),
        // Update API Endpoint if provided / 如果提供则更新API接口地址
        ...(apiEndpoint !== undefined && { apiEndpoint: apiEndpoint || null }),
        // Update API Key if provided / 如果提供则更新API密钥
        ...(apiKey !== undefined && { apiKey: apiKey || null }),
      },
    });

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.AI_MODEL,
      targetId: id,
      description: `Updated AI model / 更新AI模型: ${model.name}`,
      req,
    });

    res.json({
      success: true,
      data: {
        ...model,
        // Mask API key for security / 为安全起见遮蔽API Key
        apiKey: model.apiKey ? `${model.apiKey.substring(0, 8)}****` : null,
      },
    });
  } catch (error) {
    logger.error('Update AI model error / 更新AI模型错误', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update AI model / 更新AI模型失败',
    });
  }
}

/**
 * Delete AI Model
 * DELETE /api/admin/ai-models/:id
 */
export async function deleteAIModel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const model = await prisma.aIModel.findUnique({
      where: { id },
    });

    if (!model) {
      res.status(404).json({
        success: false,
        error: 'AI model not found',
      });
      return;
    }

    if (model.isDefault) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete default AI model',
      });
      return;
    }

    await prisma.aIModel.delete({
      where: { id },
    });

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.AI_MODEL,
      targetId: id,
      description: `Deleted AI model: ${model.name}`,
      req,
    });

    res.json({
      success: true,
      message: 'AI model deleted',
    });
  } catch (error) {
    logger.error('Delete AI model error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete AI model',
    });
  }
}

// ==================== User Details ====================

/**
 * Get User Details with Statistics
 * GET /api/admin/users/:id
 */
export async function getUserDetails(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Get user statistics
    const [
      totalSessions,
      completedSessions,
      feedbacks,
      recentSessions,
      topScenarios,
    ] = await Promise.all([
      prisma.session.count({ where: { userId: id } }),
      prisma.session.count({ where: { userId: id, status: 'COMPLETED' } }),
      prisma.feedback.findMany({
        where: { session: { userId: id } },
        select: { overallScore: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.session.findMany({
        where: { userId: id, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: {
          scenario: {
            select: { title: true, category: true },
          },
          feedback: {
            select: { overallScore: true },
          },
        },
      }),
      prisma.session.groupBy({
        by: ['scenarioId'],
        where: { userId: id, status: 'COMPLETED' },
        _count: { scenarioId: true },
        orderBy: { _count: { scenarioId: 'desc' } },
        take: 5,
      }),
    ]);

    // Calculate statistics
    const averageScore = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.overallScore, 0) / feedbacks.length
      : 0;

    const bestScore = feedbacks.length > 0
      ? Math.max(...feedbacks.map(f => f.overallScore))
      : 0;

    // Score trend (last 10 feedbacks)
    const scoreTrend = feedbacks.slice(0, 10).reverse().map(f => ({
      score: f.overallScore,
      date: f.createdAt,
    }));

    // Get scenario details for top scenarios
    const topScenarioIds = topScenarios.map(s => s.scenarioId);
    const scenarioDetails = await prisma.scenario.findMany({
      where: { id: { in: topScenarioIds } },
      select: { id: true, title: true },
    });

    const topScenariosWithDetails = topScenarios.map(s => ({
      scenarioId: s.scenarioId,
      title: scenarioDetails.find(d => d.id === s.scenarioId)?.title || 'Unknown',
      practiceCount: s._count.scenarioId,
    }));

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          totalSessions,
          completedSessions,
          averageScore: Math.round(averageScore * 10) / 10,
          bestScore,
          scoreTrend,
        },
        recentSessions: recentSessions.map(s => ({
          id: s.id,
          scenarioTitle: s.scenario.title,
          scenarioCategory: s.scenario.category,
          score: s.feedback?.overallScore,
          completedAt: s.completedAt,
        })),
        topScenarios: topScenariosWithDetails,
      },
    });
  } catch (error) {
    logger.error('Get user details error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get user details',
    });
  }
}

// ==================== Export Functions ====================

/**
 * Export Statistics Report
 * GET /api/admin/export/statistics
 */
export async function exportStatistics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { startDate, endDate, type = 'all' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get data based on type
    let data: Record<string, unknown> = {};

    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          createdAt: true,
          _count: { select: { sessions: true } },
        },
      });
      data.users = users;
    }

    if (type === 'all' || type === 'scenarios') {
      const scenarios = await prisma.scenario.findMany({
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          practiceCount: true,
          averageScore: true,
          isActive: true,
          createdAt: true,
        },
      });
      data.scenarios = scenarios;
    }

    if (type === 'all' || type === 'sessions') {
      const sessions = await prisma.session.findMany({
        where: {
          completedAt: { gte: start, lte: end },
        },
        include: {
          user: { select: { name: true, email: true } },
          scenario: { select: { title: true } },
          feedback: { select: { overallScore: true } },
        },
      });
      data.sessions = sessions;
    }

    // Log operation
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.EXPORT,
      targetType: TargetType.SETTING,
      description: `Exported ${type} statistics report`,
      details: { startDate: start, endDate: end, type },
      req,
    });

    res.json({
      success: true,
      data: {
        exportDate: new Date(),
        dateRange: { start, end },
        type,
        ...data,
      },
    });
  } catch (error) {
    logger.error('Export statistics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to export statistics',
    });
  }
}

// ==================== AI Model Testing / AI模型测试 ====================

/**
 * Test AI Model Connection
 * 测试AI模型连接
 * POST /api/admin/ai-models/:id/test
 * 
 * Supports testing different model types / 支持测试不同模型类型:
 * - CHAT: Tests text generation / 测试文本生成
 * - TTS: Tests speech synthesis / 测试语音合成
 * - EMBEDDING: Tests vector generation / 测试向量生成
 * 
 * Uses model-specific API config if available / 如果可用则使用模型特定的API配置
 */
export async function testAIModel(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    // Get the model from database / 从数据库获取模型
    const model = await prisma.aIModel.findUnique({
      where: { id },
    });
    if (!model) {
      res.status(404).json({
        success: false,
        error: 'AI model not found / 未找到AI模型',
      });
      return;
    }

    // Get model type from config or detect from modelId
    // 从配置获取模型类型或从modelId检测
    const modelConfig = model.config as Record<string, unknown> | null;
    const modelType = (modelConfig?.modelType as AIModelType) || aiService.detectModelType(model.modelId);

    // Test the model connection using the modelId, type, and model-specific API config
    // 使用modelId、类型和模型特定的API配置测试模型连接
    const testResult = await aiService.testModelConnection(
      model.modelId, 
      modelType,
      {
        apiEndpoint: model.apiEndpoint,
        apiKey: model.apiKey,
      }
    );

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.TEST,
      targetType: TargetType.AI_MODEL,
      targetId: id,
      description: `Tested AI model connection / 测试AI模型连接: ${model.name} (${modelType}) - ${testResult.success ? 'Success/成功' : 'Failed/失败'}`,
      details: {
        modelId: model.modelId,
        modelType,
        responseTime: testResult.responseTime,
        success: testResult.success,
        hasCustomApiConfig: !!(model.apiEndpoint || model.apiKey),
      },
      req,
    });

    logger.info('AI model tested / AI模型已测试', {
      modelId: model.modelId,
      modelType,
      success: testResult.success,
      responseTime: testResult.responseTime,
      hasCustomApiConfig: !!(model.apiEndpoint || model.apiKey),
    });

    res.json({
      success: true,
      data: {
        modelId: model.modelId,
        modelName: model.name,
        modelType,
        testResult: testResult.success,
        responseTime: testResult.responseTime,
        message: testResult.message,
        error: testResult.error,
        hasCustomApiConfig: !!(model.apiEndpoint || model.apiKey),
      },
    });
  } catch (error) {
    logger.error('Test AI model error / 测试AI模型错误', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to test AI model / 测试AI模型失败',
    });
  }
}

/**
 * Test AI Model Connection by Model ID (without database record)
 * 通过模型ID直接测试AI模型连接（无需数据库记录）
 * POST /api/admin/ai-models/test-direct
 * 
 * Request body / 请求体:
 * - modelId: The model identifier / 模型标识符
 * - modelType: Optional model type (CHAT/TTS/EMBEDDING) / 可选模型类型
 * - apiEndpoint: Optional custom API endpoint / 可选自定义API端点
 * - apiKey: Optional custom API key / 可选自定义API密钥
 */
export async function testAIModelDirect(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { modelId, modelType, apiEndpoint, apiKey } = req.body;
    if (!modelId) {
      res.status(400).json({
        success: false,
        error: 'Model ID is required / 模型ID是必填项',
      });
      return;
    }

    // Validate model type if provided / 验证模型类型（如果提供）
    const validModelTypes = Object.values(AIModelType);
    if (modelType && !validModelTypes.includes(modelType)) {
      res.status(400).json({
        success: false,
        error: `Invalid model type. Must be one of: ${validModelTypes.join(', ')} / 无效的模型类型，必须是以下之一: ${validModelTypes.join(', ')}`,
      });
      return;
    }

    // Detect model type if not provided / 如果未提供则检测模型类型
    const detectedType = modelType || aiService.detectModelType(modelId);

    // Test the model connection directly with optional custom API config
    // 使用可选的自定义API配置直接测试模型连接
    const testResult = await aiService.testModelConnection(
      modelId, 
      detectedType,
      {
        apiEndpoint: apiEndpoint || null,
        apiKey: apiKey || null,
      }
    );

    logger.info('AI model tested directly / AI模型直接测试', {
      modelId,
      modelType: detectedType,
      success: testResult.success,
      responseTime: testResult.responseTime,
      hasCustomApiConfig: !!(apiEndpoint || apiKey),
    });

    res.json({
      success: true,
      data: {
        modelId,
        modelType: detectedType,
        testResult: testResult.success,
        responseTime: testResult.responseTime,
        message: testResult.message,
        error: testResult.error,
        hasCustomApiConfig: !!(apiEndpoint || apiKey),
      },
    });
  } catch (error) {
    logger.error('Test AI model direct error / 直接测试AI模型错误', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to test AI model / 测试AI模型失败',
    });
  }
}

