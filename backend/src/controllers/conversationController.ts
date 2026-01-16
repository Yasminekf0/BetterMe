import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import * as conversationService from '../services/conversationService';
import { logger } from '../utils/logger';

/**
 * Get User's Conversations
 * GET /api/conversations
 */
export async function getUserConversations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { page = '1', pageSize = '20', archived = 'false', favorited } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;
    const isArchived = archived === 'true';
    const isFavorited = favorited ? favorited === 'true' : undefined;

    const result = await conversationService.getUserConversations({
      userId,
      archived: isArchived,
      favorited: isFavorited,
      limit: pageSizeNum,
      offset,
    });

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(result.total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Get user conversations error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
    });
  }
}

/**
 * Get Conversation by ID
 * GET /api/conversations/:conversationId
 */
export async function getConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    const conversation = await conversationService.getConversation(conversationId);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    // Verify ownership
    if (conversation.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this conversation',
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    logger.error('Get conversation error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
}

/**
 * Get Conversation by Session ID
 * GET /api/conversations/session/:sessionId
 */
export async function getConversationBySession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    // Verify user owns the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    const conversation = await conversationService.getConversationBySessionId(sessionId);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found for this session',
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    logger.error('Get conversation by session error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
}

/**
 * Update Conversation Metadata
 * PUT /api/conversations/:conversationId
 */
export async function updateConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const { title, summary, keyTopics, tags } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this conversation',
      });
      return;
    }

    const updated = await conversationService.updateConversationMetadata(conversationId, {
      title,
      summary,
      keyTopics,
      tags,
    });

    logger.info('Conversation updated', { conversationId, userId });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Update conversation error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation',
    });
  }
}

/**
 * Update Conversation State (archive, pin, favorite)
 * PUT /api/conversations/:conversationId/state
 */
export async function updateConversationState(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const { isArchived, isPinned, isFavorited } = req.body;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
      return;
    }

    // Validate input
    if (
      typeof isArchived !== 'boolean' &&
      typeof isPinned !== 'boolean' &&
      typeof isFavorited !== 'boolean'
    ) {
      res.status(400).json({
        success: false,
        error: 'At least one state field is required',
      });
      return;
    }

    const updated = await conversationService.updateConversationState(conversationId, {
      ...(isArchived !== undefined && { isArchived }),
      ...(isPinned !== undefined && { isPinned }),
      ...(isFavorited !== undefined && { isFavorited }),
    });

    logger.info('Conversation state updated', { conversationId, userId });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Update conversation state error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation state',
    });
  }
}

/**
 * Delete Conversation
 * DELETE /api/conversations/:conversationId
 */
export async function deleteConversation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
      return;
    }

    if (conversation.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this conversation',
      });
      return;
    }

    await conversationService.deleteConversation(conversationId);

    logger.info('Conversation deleted', { conversationId, userId });

    res.json({
      success: true,
      data: { id: conversationId },
    });
  } catch (error) {
    logger.error('Delete conversation error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
    });
  }
}

/**
 * Search Conversations
 * GET /api/conversations/search
 */
export async function searchConversations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { q, page = '1', pageSize = '20' } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    const result = await conversationService.searchConversations(userId, q as string, {
      limit: pageSizeNum,
      offset,
    });

    res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(result.total / pageSizeNum),
      },
    });
  } catch (error) {
    logger.error('Search conversations error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to search conversations',
    });
  }
}

/**
 * Get Conversation Statistics
 * GET /api/conversations/stats
 */
export async function getConversationStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const stats = await conversationService.getUserConversationStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get conversation stats error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation statistics',
    });
  }
}
