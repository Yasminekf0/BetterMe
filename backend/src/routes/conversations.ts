import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserConversations,
  getConversation,
  getConversationBySession,
  updateConversation,
  updateConversationState,
  deleteConversation,
  searchConversations,
  getConversationStats,
} from '../controllers/conversationController';

const router = Router();

/**
 * Conversation Routes
 * All routes require authentication
 */

router.use(authenticate);

// Statistics (must be before /:conversationId to avoid route conflicts)
router.get('/stats', getConversationStats);

// Search (must be before /:conversationId to avoid route conflicts)
router.get('/search', searchConversations);

// Get all conversations
router.get('/', getUserConversations);

// Get conversation by session ID
router.get('/session/:sessionId', getConversationBySession);

// Get specific conversation
router.get('/:conversationId', getConversation);

// Update conversation metadata
router.put('/:conversationId', updateConversation);

// Update conversation state (archive, pin, favorite)
router.put('/:conversationId/state', updateConversationState);

// Delete conversation
router.delete('/:conversationId', deleteConversation);

export default router;
