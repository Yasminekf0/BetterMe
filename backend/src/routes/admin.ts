import { Router, Response } from 'express';
import { authenticate, adminOnly, trainerOrAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import {
  // Personas routes / 角色模板路由
  getPersonaTemplates,
  createPersonaTemplate,
  updatePersonaTemplate,
  deletePersonaTemplate,
  // User details route / 用户详情路由
  getUserDetails,
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

// ==================== Buyer Persona Templates Routes / 买家角色模板路由 ====================

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

// ==================== User Details Routes / 用户详情路由 ====================

/**
 * Get User Details with Statistics
 * GET /api/admin/users/:id
 */
router.get('/users/:id', adminOnly, getUserDetails);

// ==================== Products Routes / 产品路由 ====================
// Note: Products management uses the scenario system for training scenarios
// 注意：产品管理使用场景系统来管理培训场景

export default router;

