import { Router, Response } from 'express';
import { authenticate, adminOnly, trainerOrAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { aiService, AIModelType } from '../services/aiService';
import bcrypt from 'bcryptjs';
import {
  getSettings,
  getSettingsByCategory,
  updateSettings,
  resetSettings,
  getOperationLogs,
  getPersonaTemplates,
  createPersonaTemplate,
  updatePersonaTemplate,
  deletePersonaTemplate,
  getAIModels,
  createAIModel,
  updateAIModel,
  deleteAIModel,
  testAIModel,
  testAIModelDirect,
  getUserDetails,
  exportStatistics,
} from '../controllers/adminController';
import { logOperation, OperationType, TargetType } from '../services/operationLogService';

const router = Router();

/**
 * Admin Routes
 * All routes require authentication and admin/trainer role
 */

router.use(authenticate);

/**
 * Get Admin Dashboard Statistics
 * GET /api/admin/statistics
 */
router.get('/statistics', trainerOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeUsersToday,
      sessionsToday,
      totalActiveScenarios,
      allFeedbacks,
      recentSessions,
    ] = await Promise.all([
      // Active users today (users who completed a session today)
      prisma.session.groupBy({
        by: ['userId'],
        where: {
          completedAt: { gte: today },
        },
      }),
      // Sessions completed today
      prisma.session.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today },
        },
      }),
      // Total active scenarios
      prisma.scenario.count({
        where: { isActive: true },
      }),
      // All feedbacks for average score
      prisma.feedback.findMany({
        select: { overallScore: true },
      }),
      // Recent sessions for trend
      prisma.session.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          completedAt: true,
        },
      }),
    ]);

    // Calculate average score
    const averageScore = allFeedbacks.length > 0
      ? allFeedbacks.reduce((sum, f) => sum + f.overallScore, 0) / allFeedbacks.length
      : 0;

    // Calculate practices trend (last 7 days)
    const practicesTrend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = recentSessions.filter(s => 
        s.completedAt && s.completedAt >= date && s.completedAt < nextDate
      ).length;

      practicesTrend.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // Score distribution
    const scoreDistribution = [
      { range: '0-60', count: allFeedbacks.filter(f => f.overallScore < 60).length },
      { range: '60-70', count: allFeedbacks.filter(f => f.overallScore >= 60 && f.overallScore < 70).length },
      { range: '70-80', count: allFeedbacks.filter(f => f.overallScore >= 70 && f.overallScore < 80).length },
      { range: '80-90', count: allFeedbacks.filter(f => f.overallScore >= 80 && f.overallScore < 90).length },
      { range: '90-100', count: allFeedbacks.filter(f => f.overallScore >= 90).length },
    ];

    // Top scenarios
    const topScenarios = await prisma.scenario.findMany({
      where: { isActive: true },
      orderBy: { practiceCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        practiceCount: true,
        averageScore: true,
      },
    });

    res.json({
      success: true,
      data: {
        activeUsersToday: activeUsersToday.length,
        sessionsToday,
        activeScenarios: totalActiveScenarios,
        averageScore: Math.round(averageScore * 10) / 10,
        practicesTrend,
        scoreDistribution,
        topScenarios,
      },
    });
  } catch (error) {
    logger.error('Get admin statistics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

/**
 * Get All Scenarios (Admin)
 * GET /api/admin/scenarios
 */
router.get('/scenarios', trainerOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Record<string, unknown> = {};
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [scenarios, total] = await Promise.all([
      prisma.scenario.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { name: true },
          },
        },
      }),
      prisma.scenario.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: scenarios,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Get admin scenarios error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get scenarios',
    });
  }
});

/**
 * Create Scenario (Admin)
 * POST /api/admin/scenarios
 */
router.post('/scenarios', trainerOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      estimatedDuration,
      buyerPersona,
      objections,
      idealResponses,
      maxTurns,
      openingPrompt,
    } = req.body;

    if (!title || !description || !category || !buyerPersona) {
      res.status(400).json({
        success: false,
        error: 'Title, description, category, and buyer persona are required',
      });
      return;
    }

    const scenario = await prisma.scenario.create({
      data: {
        title,
        description,
        category,
        difficulty: difficulty?.toUpperCase() || 'MEDIUM',
        estimatedDuration: estimatedDuration || 15,
        buyerPersona,
        objections: objections || [],
        idealResponses: idealResponses || [],
        maxTurns: maxTurns || 8,
        openingPrompt,
        createdById: req.user!.id,
      },
    });

    // Log operation
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.SCENARIO,
      targetId: scenario.id,
      description: `Created scenario: ${title}`,
      req,
    });

    logger.info('Scenario created', { scenarioId: scenario.id, createdBy: req.user!.id });

    res.status(201).json({
      success: true,
      data: scenario,
    });
  } catch (error) {
    logger.error('Create scenario error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create scenario',
    });
  }
});

/**
 * Update Scenario (Admin)
 * PUT /api/admin/scenarios/:id
 */
router.put('/scenarios/:id', trainerOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.createdById;
    delete updateData.createdAt;
    delete updateData.practiceCount;
    delete updateData.averageScore;

    // Convert difficulty to uppercase if provided
    if (updateData.difficulty) {
      updateData.difficulty = updateData.difficulty.toUpperCase();
    }

    const scenario = await prisma.scenario.update({
      where: { id },
      data: updateData,
    });

    // Log operation
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SCENARIO,
      targetId: id,
      description: `Updated scenario: ${scenario.title}`,
      req,
    });

    logger.info('Scenario updated', { scenarioId: id, updatedBy: req.user!.id });

    res.json({
      success: true,
      data: scenario,
    });
  } catch (error) {
    logger.error('Update scenario error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update scenario',
    });
  }
});

/**
 * Toggle Scenario Status (Admin)
 * PUT /api/admin/scenarios/:id/status
 */
router.put('/scenarios/:id/status', trainerOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      res.status(404).json({
        success: false,
        error: 'Scenario not found',
      });
      return;
    }

    const updatedScenario = await prisma.scenario.update({
      where: { id },
      data: { isActive: !scenario.isActive },
    });

    // Log operation
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.STATUS_CHANGE,
      targetType: TargetType.SCENARIO,
      targetId: id,
      description: `Toggled scenario status: ${scenario.title} - now ${updatedScenario.isActive ? 'active' : 'inactive'}`,
      req,
    });

    logger.info('Scenario status toggled', { scenarioId: id, isActive: updatedScenario.isActive });

    res.json({
      success: true,
      data: updatedScenario,
    });
  } catch (error) {
    logger.error('Toggle scenario status error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to toggle scenario status',
    });
  }
});

/**
 * Delete Scenario (Admin only)
 * DELETE /api/admin/scenarios/:id
 */
router.delete('/scenarios/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get scenario info before deletion for logging
    const scenario = await prisma.scenario.findUnique({
      where: { id },
      select: { title: true },
    });

    await prisma.scenario.delete({
      where: { id },
    });

    // Log operation
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.SCENARIO,
      targetId: id,
      description: `Deleted scenario: ${scenario?.title || id}`,
      req,
    });

    logger.info('Scenario deleted', { scenarioId: id, deletedBy: req.user!.id });

    res.json({
      success: true,
      message: 'Scenario deleted',
    });
  } catch (error) {
    logger.error('Delete scenario error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete scenario',
    });
  }
});

/**
 * Get All Users (Admin)
 * GET /api/admin/users
 */
router.get('/users', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', pageSize = '20', role } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Record<string, unknown> = {};
    if (role) {
      where.role = (role as string).toUpperCase();
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
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
          _count: {
            select: { sessions: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: users,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Get admin users error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
    });
  }
});

/**
 * Update User (Admin)
 * PUT /api/admin/users/:id
 */
router.put('/users/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, department, isActive, password } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role.toUpperCase();
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    // Log operation
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.USER,
      targetId: id,
      description: `Updated user: ${user.name} (${user.email})`,
      details: { updatedFields: Object.keys(updateData).filter(k => k !== 'password') },
      req,
    });

    logger.info('User updated by admin', { userId: id, updatedBy: req.user!.id });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Update user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

/**
 * Delete User (Admin only)
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.id) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
      return;
    }

    // Get user info before deletion for logging
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { name: true, email: true },
    });

    await prisma.user.delete({
      where: { id },
    });

    // Log operation
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.USER,
      targetId: id,
      description: `Deleted user: ${userToDelete?.name || id} (${userToDelete?.email || 'unknown'})`,
      req,
    });

    logger.info('User deleted', { userId: id, deletedBy: req.user!.id });

    res.json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    logger.error('Delete user error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

/**
 * Get Available AI Models (includes service defaults and database models)
 * 获取可用AI模型（包含服务默认模型和数据库模型）
 * GET /api/admin/ai-models/available
 * 
 * Supports Aliyun Bailian model categories / 支持阿里云百炼模型分类:
 * - CHAT: Text chat models (文本对话模型)
 * - TTS: Text-to-Speech models (语音合成模型)
 * - STT: Speech-to-Text models (语音转文字模型)
 * - EMBEDDING: Vector/Embedding models (向量模型)
 * - MULTIMODAL: Multimodal models (多模态模型)
 * 
 * Query params / 查询参数:
 * - category: Optional filter by model category / 可选按模型分类筛选
 * 
 * API Doc: https://help.aliyun.com/zh/model-studio/
 */
router.get('/ai-models/available', trainerOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;

    // Valid categories / 有效的分类
    const validCategories = ['CHAT', 'TTS', 'STT', 'EMBEDDING', 'MULTIMODAL'];
    
    // Validate category if provided / 验证分类（如果提供）
    if (category && !validCategories.includes(category as string)) {
      res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')} / 无效的分类，必须是以下之一: ${validCategories.join(', ')}`,
      });
      return;
    }

    // Get models from AI service / 从AI服务获取模型
    let defaultModels = aiService.getAvailableModels();
    
    // Filter by category if specified / 如果指定则按分类筛选
    if (category) {
      defaultModels = aiService.getModelsByType(category as AIModelType);
    }

    // Group default models by category / 按分类分组默认模型
    const groupedDefaultModels = {
      chat: defaultModels.filter(m => m.type === AIModelType.CHAT),
      tts: defaultModels.filter(m => m.type === AIModelType.TTS),
      stt: defaultModels.filter(m => m.type === AIModelType.STT),
      embedding: defaultModels.filter(m => m.type === AIModelType.EMBEDDING),
    };

    // Get models from database, using category field directly
    // 从数据库获取模型，直接使用category字段
    const whereClause: Record<string, unknown> = { isActive: true };
    if (category) {
      whereClause.category = category;
    }

    const dbModels = await prisma.aIModel.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });

    // Group database models by category field / 按category字段分组数据库模型
    const groupedDbModels = {
      chat: dbModels.filter(m => m.category === 'CHAT'),
      tts: dbModels.filter(m => m.category === 'TTS'),
      stt: dbModels.filter(m => m.category === 'STT'),
      embedding: dbModels.filter(m => m.category === 'EMBEDDING'),
      multimodal: dbModels.filter(m => m.category === 'MULTIMODAL'),
    };

    // Mask API keys for security / 为安全起见遮蔽API密钥
    const maskedDbModels = dbModels.map(m => ({
      ...m,
      apiKey: m.apiKey ? `${m.apiKey.substring(0, 8)}****` : null,
    }));

    res.json({
      success: true,
      data: {
        // All models / 所有模型
        defaultModels,
        customModels: maskedDbModels,
        // Grouped by category / 按分类分组
        byCategory: {
          default: groupedDefaultModels,
          custom: groupedDbModels,
        },
        // Available model categories / 可用模型分类
        categories: validCategories,
      },
    });
  } catch (error) {
    logger.error('Get AI models error / 获取AI模型错误', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get AI models / 获取AI模型失败',
    });
  }
});

// ==================== System Settings Routes ====================

/**
 * Get All System Settings
 * GET /api/admin/settings
 */
router.get('/settings', adminOnly, getSettings);

/**
 * Get Settings by Category
 * GET /api/admin/settings/:category
 */
router.get('/settings/:category', adminOnly, getSettingsByCategory);

/**
 * Update System Settings
 * PUT /api/admin/settings
 */
router.put('/settings', adminOnly, updateSettings);

/**
 * Reset Settings to Defaults
 * POST /api/admin/settings/reset
 */
router.post('/settings/reset', adminOnly, resetSettings);

// ==================== Operation Logs Routes ====================

/**
 * Get Operation Logs
 * GET /api/admin/logs
 */
router.get('/logs', adminOnly, getOperationLogs);

// ==================== Buyer Persona Templates Routes ====================

/**
 * Get All Buyer Persona Templates
 * GET /api/admin/personas
 */
router.get('/personas', trainerOrAdmin, getPersonaTemplates);

/**
 * Create Buyer Persona Template
 * POST /api/admin/personas
 */
router.post('/personas', trainerOrAdmin, createPersonaTemplate);

/**
 * Update Buyer Persona Template
 * PUT /api/admin/personas/:id
 */
router.put('/personas/:id', trainerOrAdmin, updatePersonaTemplate);

/**
 * Delete Buyer Persona Template
 * DELETE /api/admin/personas/:id
 */
router.delete('/personas/:id', adminOnly, deletePersonaTemplate);

// ==================== AI Model Management Routes ====================

/**
 * Get All AI Models
 * GET /api/admin/ai-models
 */
router.get('/ai-models', adminOnly, getAIModels);

/**
 * Test AI Model Connection Directly (without database record)
 * POST /api/admin/ai-models/test-direct
 * Note: This route must be defined before /:id routes to avoid conflicts
 */
router.post('/ai-models/test-direct', adminOnly, testAIModelDirect);

/**
 * Create AI Model
 * POST /api/admin/ai-models
 */
router.post('/ai-models', adminOnly, createAIModel);

/**
 * Test AI Model Connection
 * POST /api/admin/ai-models/:id/test
 */
router.post('/ai-models/:id/test', adminOnly, testAIModel);

/**
 * Update AI Model
 * PUT /api/admin/ai-models/:id
 */
router.put('/ai-models/:id', adminOnly, updateAIModel);

/**
 * Delete AI Model
 * DELETE /api/admin/ai-models/:id
 */
router.delete('/ai-models/:id', adminOnly, deleteAIModel);

// ==================== User Details Routes ====================

/**
 * Get User Details with Statistics
 * GET /api/admin/users/:id
 */
router.get('/users/:id', adminOnly, getUserDetails);

// ==================== Export Routes ====================

/**
 * Export Statistics Report
 * GET /api/admin/export/statistics
 */
router.get('/export/statistics', adminOnly, exportStatistics);

export default router;

