import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

/**
 * Get All Scenarios (Active only for users)
 * GET /api/scenarios
 */
export async function getScenarios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page = '1', pageSize = '10', category, difficulty, search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    // Build filter
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = (difficulty as string).toUpperCase();
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get scenarios with pagination
    const [scenarios, total] = await Promise.all([
      prisma.scenario.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { practiceCount: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          estimatedDuration: true,
          practiceCount: true,
          averageScore: true,
          buyerPersona: true,
        },
      }),
      prisma.scenario.count({ where }),
    ]);

    // Get user's best scores for each scenario
    let scenariosWithUserScores = scenarios;
    if (req.user) {
      const userBestScores = await prisma.feedback.findMany({
        where: {
          session: {
            userId: req.user.id,
            scenarioId: { in: scenarios.map(s => s.id) },
          },
        },
        select: {
          overallScore: true,
          session: {
            select: { scenarioId: true },
          },
        },
      });

      const scoresByScenario: Record<string, number> = {};
      userBestScores.forEach(f => {
        const scenarioId = f.session.scenarioId;
        if (!scoresByScenario[scenarioId] || f.overallScore > scoresByScenario[scenarioId]) {
          scoresByScenario[scenarioId] = f.overallScore;
        }
      });

      scenariosWithUserScores = scenarios.map(s => ({
        ...s,
        myBestScore: scoresByScenario[s.id] || null,
      }));
    }

    res.json({
      success: true,
      data: {
        items: scenariosWithUserScores,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Get scenarios error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get scenarios',
    });
  }
}

/**
 * Get Scenario by ID
 * GET /api/scenarios/:id
 */
export async function getScenarioById(req: AuthRequest, res: Response): Promise<void> {
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

    // Get user's history for this scenario
    let userHistory = null;
    if (req.user) {
      const sessions = await prisma.session.findMany({
        where: {
          userId: req.user.id,
          scenarioId: id,
          status: 'COMPLETED',
        },
        include: {
          feedback: {
            select: { overallScore: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      });

      const scores = sessions
        .filter(s => s.feedback)
        .map(s => s.feedback!.overallScore);

      userHistory = {
        practiceCount: sessions.length,
        bestScore: scores.length > 0 ? Math.max(...scores) : null,
        averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        recentScores: scores.slice(0, 5),
      };
    }

    res.json({
      success: true,
      data: {
        ...scenario,
        userHistory,
      },
    });
  } catch (error) {
    logger.error('Get scenario by ID error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get scenario',
    });
  }
}

/**
 * Get Recommended Scenarios
 * GET /api/scenarios/recommended
 */
export async function getRecommendedScenarios(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    // Get all active scenarios
    const scenarios = await prisma.scenario.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedDuration: true,
        practiceCount: true,
        averageScore: true,
        buyerPersona: true,
        createdAt: true,
      },
      orderBy: { practiceCount: 'desc' },
    });

    // Get user's practice history
    let userPractices: { scenarioId: string; score: number }[] = [];
    if (userId) {
      const feedbacks = await prisma.feedback.findMany({
        where: {
          session: { userId },
        },
        select: {
          overallScore: true,
          session: {
            select: { scenarioId: true },
          },
        },
      });

      userPractices = feedbacks.map(f => ({
        scenarioId: f.session.scenarioId,
        score: f.overallScore,
      }));
    }

    // Categorize recommendations
    const practicedScenarioIds = new Set(userPractices.map(p => p.scenarioId));
    
    // Scenarios needing improvement (low scores)
    const lowScoreScenarios: Record<string, number> = {};
    userPractices.forEach(p => {
      if (!lowScoreScenarios[p.scenarioId] || p.score < lowScoreScenarios[p.scenarioId]) {
        lowScoreScenarios[p.scenarioId] = p.score;
      }
    });

    const recommendations = scenarios.slice(0, 6).map(s => {
      let reason = 'popular';
      
      // Check if new (created in last 7 days)
      const isNew = new Date(s.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (isNew) {
        reason = 'new';
      }
      
      // Check if needs improvement
      if (lowScoreScenarios[s.id] && lowScoreScenarios[s.id] < 70) {
        reason = 'improve';
      }
      
      // Check if not practiced
      if (!practicedScenarioIds.has(s.id)) {
        reason = 'new';
      }

      return {
        ...s,
        reason,
      };
    });

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Get recommended scenarios error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
    });
  }
}

