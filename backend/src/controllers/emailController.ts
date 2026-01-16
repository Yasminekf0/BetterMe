import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { aiService } from '../services/aiService';

/**
 * Generate Follow-up Email
 * POST /api/email/generate
 */
export async function generateEmail(req: AuthRequest, res: Response): Promise<void> {
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
        email: true,
        user: {
          select: { name: true },
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

    if (session.status !== 'COMPLETED') {
      res.status(400).json({
        success: false,
        error: 'Session must be completed before generating email',
      });
      return;
    }

    // Check if email already exists
    if (session.email) {
      res.json({
        success: true,
        data: session.email,
        message: 'Email already exists',
      });
      return;
    }

    // Build conversation history for AI
    const conversationHistory = session.messages.map(m => ({
      role: m.role === 'USER' ? 'user' : 'assistant' as 'user' | 'assistant',
      content: m.content,
    }));

    const buyerPersona = session.scenario.buyerPersona as Record<string, unknown>;
    const userSignature = `${session.user.name}\nSales Representative`;

    try {
      // Generate email using AI
      const emailData = await aiService.generateFollowUpEmail(
        session.scenario.description,
        buyerPersona.name as string,
        conversationHistory,
        userSignature
      );

      // Save email
      const email = await prisma.followUpEmail.create({
        data: {
          sessionId,
          userId,
          subject: emailData.subject,
          body: emailData.body,
          isEdited: false,
        },
      });

      logger.info('Email generated', { sessionId, emailId: email.id });

      res.status(201).json({
        success: true,
        data: email,
      });
    } catch (aiError) {
      logger.error('AI email generation failed', { error: aiError, sessionId });
      res.status(500).json({
        success: false,
        error: 'Failed to generate email. Please try again.',
      });
    }
  } catch (error) {
    logger.error('Generate email error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate email',
    });
  }
}

/**
 * Update Email
 * PUT /api/email/:id
 */
export async function updateEmail(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { subject, body, toAddress } = req.body;
    const userId = req.user!.id;

    // Get email
    const email = await prisma.followUpEmail.findUnique({
      where: { id },
    });

    if (!email) {
      res.status(404).json({
        success: false,
        error: 'Email not found',
      });
      return;
    }

    if (email.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
      return;
    }

    // Update email
    const updatedEmail = await prisma.followUpEmail.update({
      where: { id },
      data: {
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
        ...(toAddress !== undefined && { toAddress }),
        isEdited: true,
      },
    });

    logger.info('Email updated', { emailId: id });

    res.json({
      success: true,
      data: updatedEmail,
    });
  } catch (error) {
    logger.error('Update email error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update email',
    });
  }
}

/**
 * Get Email by Session ID
 * GET /api/email/:sessionId
 */
export async function getEmailBySession(req: AuthRequest, res: Response): Promise<void> {
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

    // Get email
    const email = await prisma.followUpEmail.findUnique({
      where: { sessionId },
    });

    if (!email) {
      res.status(404).json({
        success: false,
        error: 'Email not found',
      });
      return;
    }

    res.json({
      success: true,
      data: email,
    });
  } catch (error) {
    logger.error('Get email error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get email',
    });
  }
}

