import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Conversation Service
 * Manages conversation records for roleplay sessions
 * Provides high-level abstractions over individual messages
 */

interface ConversationMetadata {
  title?: string;
  summary?: string;
  keyTopics?: string[];
  tags?: string[];
}

interface ConversationFilter {
  userId: string;
  archived?: boolean;
  favorited?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Create a new conversation record for a session
 */
export async function createConversation(
  sessionId: string,
  userId: string,
  scenarioId: string,
  metadata?: ConversationMetadata
) {
  try {
    const conversation = await prisma.conversation.create({
      data: {
        sessionId,
        userId,
        scenarioId,
        title: metadata?.title,
        summary: metadata?.summary,
        keyTopics: metadata?.keyTopics,
        tags: metadata?.tags,
      },
    });

    logger.info('Conversation created', { conversationId: conversation.id, sessionId, userId });
    return conversation;
  } catch (error) {
    logger.error('Create conversation error', { error, sessionId, userId });
    throw error;
  }
}

/**
 * Get a conversation by ID with all messages
 */
export async function getConversation(conversationId: string) {
  try {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        session: {
          include: { scenario: true },
        },
      },
    });
  } catch (error) {
    logger.error('Get conversation error', { error, conversationId });
    throw error;
  }
}

/**
 * Get conversation by session ID
 */
export async function getConversationBySessionId(sessionId: string) {
  try {
    return await prisma.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  } catch (error) {
    logger.error('Get conversation by session ID error', { error, sessionId });
    throw error;
  }
}

/**
 * Update conversation metadata
 */
export async function updateConversationMetadata(
  conversationId: string,
  data: ConversationMetadata
) {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        title: data.title,
        summary: data.summary,
        keyTopics: data.keyTopics,
        tags: data.tags,
        updatedAt: new Date(),
      },
    });

    logger.info('Conversation metadata updated', { conversationId });
    return conversation;
  } catch (error) {
    logger.error('Update conversation metadata error', { error, conversationId });
    throw error;
  }
}

/**
 * Update conversation state (archive, pin, favorite)
 */
export async function updateConversationState(
  conversationId: string,
  state: {
    isArchived?: boolean;
    isPinned?: boolean;
    isFavorited?: boolean;
  }
) {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...state,
        updatedAt: new Date(),
      },
    });

    logger.info('Conversation state updated', { conversationId, state });
    return conversation;
  } catch (error) {
    logger.error('Update conversation state error', { error, conversationId });
    throw error;
  }
}

/**
 * Get all conversations for a user with pagination
 */
export async function getUserConversations(filter: ConversationFilter) {
  try {
    const { userId, archived = false, favorited, limit = 20, offset = 0 } = filter;

    const where: Record<string, any> = {
      userId,
      isArchived: archived,
    };

    if (favorited !== undefined) {
      where.isFavorited = favorited;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            select: { id: true },
          },
          session: {
            select: {
              id: true,
              status: true,
              completedAt: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      items: conversations,
      total,
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Get user conversations error', { error, userId: filter.userId });
    throw error;
  }
}

/**
 * Update conversation statistics after message exchange
 */
export async function updateConversationStats(
  conversationId: string,
  data: {
    userMessageCount?: number;
    aiMessageCount?: number;
    messageCount?: number;
    averageSentiment?: number;
  }
) {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        userMessageCount: data.userMessageCount,
        aiMessageCount: data.aiMessageCount,
        messageCount: data.messageCount,
        averageSentiment: data.averageSentiment,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    logger.error('Update conversation stats error', { error, conversationId });
    throw error;
  }
}

/**
 * Complete a conversation
 */
export async function completeConversation(conversationId: string) {
  try {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info('Conversation completed', { conversationId });
    return conversation;
  } catch (error) {
    logger.error('Complete conversation error', { error, conversationId });
    throw error;
  }
}

/**
 * Delete a conversation and all related messages
 */
export async function deleteConversation(conversationId: string) {
  try {
    // Cascade delete is handled by database constraints
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    logger.info('Conversation deleted', { conversationId });
    return true;
  } catch (error) {
    logger.error('Delete conversation error', { error, conversationId });
    throw error;
  }
}

/**
 * Search conversations by title, summary, or tags
 */
export async function searchConversations(
  userId: string,
  query: string,
  options?: { limit?: number; offset?: number }
) {
  try {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { summary: { contains: query } },
          { tags: { path: '$[*]', string_contains: query } },
        ],
      },
      skip: offset,
      take: limit,
      orderBy: { lastMessageAt: 'desc' },
    });

    const total = await prisma.conversation.count({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { summary: { contains: query } },
        ],
      },
    });

    return { items: conversations, total, limit, offset };
  } catch (error) {
    logger.error('Search conversations error', { error, userId, query });
    throw error;
  }
}

/**
 * Get conversation statistics for a user
 */
export async function getUserConversationStats(userId: string) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      select: {
        id: true,
        messageCount: true,
        completedAt: true,
      },
    });

    const totalConversations = conversations.length;
    const completedConversations = conversations.filter(c => c.completedAt).length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
    const averageMessages =
      totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0;

    return {
      totalConversations,
      completedConversations,
      activeConversations: totalConversations - completedConversations,
      totalMessages,
      averageMessagesPerConversation: averageMessages,
    };
  } catch (error) {
    logger.error('Get conversation stats error', { error, userId });
    throw error;
  }
}

export default {
  createConversation,
  getConversation,
  getConversationBySessionId,
  updateConversationMetadata,
  updateConversationState,
  getUserConversations,
  updateConversationStats,
  completeConversation,
  deleteConversation,
  searchConversations,
  getUserConversationStats,
};
