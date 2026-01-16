import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';

/**
 * Generate Feedback for Session
 * POST /api/feedback/generate
 */
export async function generateFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.body;
    const userId = req.user!.id;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        feedback: true,
      },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
      return;
    }

    if (session.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: 'Session must be completed before generating feedback',
      });
      return;
    }

    // Check if feedback already exists
    if (session.feedback) {
      res.json({
        success: true,
        data: session.feedback,
        message: 'Feedback already exists',
      });
      return;
    }

    // Need at least 2 user messages for meaningful feedback
    const userMessages = session.messages.filter(m => m.role === 'USER');
    if (userMessages.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Need at least 2 conversation turns to generate feedback',
      });
      return;
    }

    // Build conversation history for AI
    const conversationHistory = session.messages.map(m => ({
      role: m.role === 'USER' ? 'user' : 'assistant' as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      // Generate feedback using AI
      const feedbackData = await aiService.generateFeedback(
        session.scenario.description,
        session.scenario.idealResponses,
        conversationHistory
      );

      // Save feedback
      const feedback = await prisma.feedback.create({
        data: {
          sessionId,
          overallScore: feedbackData.overallScore,
          dimensions: feedbackData.dimensions,
          summary: feedbackData.summary,
          recommendations: feedbackData.recommendations,
        },
      });

      // Update scenario average score
      const allFeedbacks = await prisma.feedback.findMany({
        where: {
          session: { scenarioId: session.scenarioId },
        },
        select: { overallScore: true },
      });

      const averageScore = allFeedbacks.reduce((sum, f) => sum + f.overallScore, 0) / allFeedbacks.length;
      
      await prisma.scenario.update({
        where: { id: session.scenarioId },
        data: { averageScore },
      });

      logger.info('Feedback generated', { sessionId, overallScore: feedbackData.overallScore });

      res.status(201).json({
        success: true,
        data: feedback,
      });
    } catch (aiError) {
      logger.error('AI feedback generation failed', { error: aiError, sessionId });
      res.status(500).json({
        success: false,
        error: 'Failed to generate feedback. Please try again.',
      });
    }
  } catch (error) {
    logger.error('Generate feedback error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate feedback',
    });
  }
}

/**
 * Get Feedback by Session ID
 * GET /api/feedback/:sessionId
 */
export async function getFeedbackBySession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    // Get session first to check ownership
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
      return;
    }

    // Get feedback
    const feedback = await prisma.feedback.findUnique({
      where: { sessionId },
    });

    if (!feedback) {
      res.status(404).json({
        success: false,
        error: 'Feedback not found',
      });
      return;
    }

    res.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    logger.error('Get feedback error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get feedback',
    });
  }
}

