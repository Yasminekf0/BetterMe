import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router = Router();

/**
 * User Statistics Routes
 * All routes require authentication
 */

router.use(authenticate);

/**
 * Get User Statistics
 * GET /api/statistics/user
 * Returns practice statistics for the authenticated user
 */
router.get('/user', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    // Get user's completed sessions and feedbacks
    const [
      totalSessions,
      feedbacks,
      recentSessions,
      scenarioScores,
    ] = await Promise.all([
      // Total completed sessions
      prisma.session.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      // All feedbacks for this user
      prisma.feedback.findMany({
        where: {
          session: { userId },
        },
        select: {
          overallScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Recent sessions for score history (last 10)
      prisma.session.findMany({
        where: {
          userId,
          status: 'COMPLETED',
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: {
          scenario: {
            select: { title: true },
          },
          feedback: {
            select: { overallScore: true },
          },
        },
      }),
      // Score by scenario
      prisma.session.findMany({
        where: {
          userId,
          status: 'COMPLETED',
        },
        include: {
          scenario: {
            select: { id: true, title: true },
          },
          feedback: {
            select: { overallScore: true },
          },
        },
      }),
    ]);

    // Calculate statistics
    const totalPractices = totalSessions;
    
    // Average score
    const averageScore = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.overallScore, 0) / feedbacks.length
      : 0;

    // Best score
    const bestScore = feedbacks.length > 0
      ? Math.max(...feedbacks.map(f => f.overallScore))
      : 0;

    // Total duration (estimated, 15 min per session)
    const totalDuration = totalPractices * 15;

    // This week's practices
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const thisWeekPractices = feedbacks.filter(
      f => f.createdAt >= startOfWeek
    ).length;

    // Score history (last 10 sessions)
    const scoreHistory = recentSessions
      .filter(s => s.feedback)
      .map(s => ({
        date: s.completedAt?.toISOString().split('T')[0] || '',
        score: s.feedback?.overallScore || 0,
        scenarioTitle: s.scenario.title,
      }))
      .reverse();

    // Score by scenario (average per scenario)
    const scenarioScoreMap = new Map<string, { title: string; scores: number[] }>();
    for (const session of scenarioScores) {
      if (session.feedback) {
        const key = session.scenario.id;
        if (!scenarioScoreMap.has(key)) {
          scenarioScoreMap.set(key, {
            title: session.scenario.title,
            scores: [],
          });
        }
        scenarioScoreMap.get(key)?.scores.push(session.feedback.overallScore);
      }
    }

    const scoreByScenario = Array.from(scenarioScoreMap.entries()).map(([scenarioId, data]) => ({
      scenarioId,
      title: data.title,
      score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10,
    }));

    res.json({
      success: true,
      data: {
        totalPractices,
        averageScore: Math.round(averageScore * 10) / 10,
        totalDuration,
        bestScore,
        thisWeekPractices,
        thisWeekTarget: 5, // Default target
        scoreHistory,
        scoreByScenario,
      },
    });
  } catch (error) {
    logger.error('Get user statistics error', { error, userId: req.user?.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
    });
  }
});

export default router;

