import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';
import { config } from '../config';

/**
 * Start Roleplay Session
 * POST /api/roleplay/start
 */
export async function startSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { scenarioId } = req.body;
    const userId = req.user!.id;

    if (!scenarioId) {
      res.status(400).json({
        success: false,
        error: 'Scenario ID is required',
      });
      return;
    }

    // Get scenario
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario || !scenario.isActive) {
      res.status(404).json({
        success: false,
        error: 'Scenario not found or inactive',
      });
      return;
    }

    // Check for existing active session
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingSession) {
      // Abandon the existing session
      await prisma.session.update({
        where: { id: existingSession.id },
        data: { status: 'ABANDONED' },
      });
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId,
        scenarioId,
        status: 'ACTIVE',
      },
      include: {
        scenario: true,
      },
    });

    // Generate initial AI message (buyer greeting)
    const buyerPersona = scenario.buyerPersona as Record<string, unknown>;
    const openingPrompt = scenario.openingPrompt || 
      `Greet the sales representative and briefly introduce yourself and your situation. Express initial interest but also some skepticism.`;

    try {
      const aiGreeting = await aiService.chatCompletion(
        [
          {
            role: 'system',
            content: `You are playing ${buyerPersona.name}, ${buyerPersona.role} at ${buyerPersona.company}. ${buyerPersona.background}. Your personality: ${buyerPersona.personality}. ${openingPrompt}`,
          },
          {
            role: 'user',
            content: 'Start the conversation by introducing yourself as the buyer.',
          },
        ],
        { temperature: 0.8 }
      );

      // Save AI greeting message
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'AI',
          content: aiGreeting,
        },
      });

      // Get updated session with messages
      const updatedSession = await prisma.session.findUnique({
        where: { id: session.id },
        include: {
          scenario: true,
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      logger.info('Roleplay session started', { sessionId: session.id, userId, scenarioId });

      res.status(201).json({
        success: true,
        data: updatedSession,
      });
    } catch (aiError) {
      logger.error('AI greeting generation failed', { error: aiError });
      
      // Return session without AI greeting - can retry
      res.status(201).json({
        success: true,
        data: session,
        message: 'Session started, but AI greeting failed. Please refresh.',
      });
    }
  } catch (error) {
    logger.error('Start session error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
    });
  }
}

/**
 * Send Message in Roleplay
 * POST /api/roleplay/message
 */
export async function sendMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId, content } = req.body;
    const userId = req.user!.id;

    if (!sessionId || !content) {
      res.status(400).json({
        success: false,
        error: 'Session ID and content are required',
      });
      return;
    }

    // Validate message length
    if (content.length < config.roleplay.minMessageLength) {
      res.status(400).json({
        success: false,
        error: `Message must be at least ${config.roleplay.minMessageLength} characters`,
      });
      return;
    }

    if (content.length > config.roleplay.maxMessageLength) {
      res.status(400).json({
        success: false,
        error: `Message must not exceed ${config.roleplay.maxMessageLength} characters`,
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

    if (session.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        error: 'Session is not active',
      });
      return;
    }

    // Check max turns
    const userMessageCount = session.messages.filter(m => m.role === 'USER').length;
    if (userMessageCount >= (session.scenario.maxTurns || config.roleplay.maxTurns)) {
      res.status(400).json({
        success: false,
        error: 'Maximum dialogue turns reached. Please end the session.',
      });
      return;
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'USER',
        content,
      },
    });

    // Build conversation history for AI
    const buyerPersona = session.scenario.buyerPersona as Record<string, unknown>;
    const conversationHistory = session.messages.map(m => ({
      role: m.role === 'USER' ? 'user' : 'assistant' as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      // Generate AI response
      const aiResponse = await aiService.generateBuyerResponse(
        session.scenario.description,
        `Name: ${buyerPersona.name}, Role: ${buyerPersona.role}, Company: ${buyerPersona.company}. Background: ${buyerPersona.background}. Concerns: ${(buyerPersona.concerns as string[]).join(', ')}. Personality: ${buyerPersona.personality}`,
        conversationHistory,
        content
      );

      // Save AI message
      const aiMessage = await prisma.message.create({
        data: {
          sessionId,
          role: 'AI',
          content: aiResponse,
        },
      });

      logger.info('Message exchanged', { 
        sessionId, 
        userMessageId: userMessage.id, 
        aiMessageId: aiMessage.id,
        turnNumber: userMessageCount + 1,
      });

      res.json({
        success: true,
        data: {
          userMessage,
          aiMessage,
          turnsRemaining: (session.scenario.maxTurns || config.roleplay.maxTurns) - userMessageCount - 1,
        },
      });
    } catch (aiError) {
      logger.error('AI response generation failed', { error: aiError, sessionId });
      res.status(500).json({
        success: false,
        error: 'Failed to generate AI response. Please try again.',
      });
    }
  } catch (error) {
    logger.error('Send message error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
}

/**
 * End Roleplay Session
 * POST /api/roleplay/end
 */
export async function endSession(req: AuthRequest, res: Response): Promise<void> {
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
        messages: true,
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

    if (session.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        error: 'Session is not active',
      });
      return;
    }

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        scenario: true,
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Update scenario practice count
    await prisma.scenario.update({
      where: { id: session.scenarioId },
      data: {
        practiceCount: { increment: 1 },
      },
    });

    logger.info('Session ended', { sessionId, userId });

    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    logger.error('End session error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
    });
  }
}

/**
 * Get Session by ID
 * GET /api/roleplay/session/:sessionId
 */
export async function getSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

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

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Get session error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
    });
  }
}

/**
 * Get User's Session History
 * GET /api/roleplay/history
 */
export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: {
          userId,
          status: 'COMPLETED',
        },
        skip,
        take: pageSizeNum,
        orderBy: { completedAt: 'desc' },
        include: {
          scenario: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
            },
          },
          feedback: {
            select: {
              overallScore: true,
            },
          },
          messages: {
            select: { id: true },
          },
        },
      }),
      prisma.session.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    // Calculate duration for each session
    const sessionsWithDuration = sessions.map(s => ({
      ...s,
      duration: s.completedAt && s.startedAt
        ? Math.round((s.completedAt.getTime() - s.startedAt.getTime()) / 60000)
        : null,
      messageCount: s.messages.length,
      messages: undefined,
    }));

    res.json({
      success: true,
      data: {
        items: sessionsWithDuration,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Get history error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get history',
    });
  }
}

