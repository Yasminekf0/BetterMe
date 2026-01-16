import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  startSession,
  sendMessage,
  endSession,
  getSession,
  getHistory,
} from '../controllers/roleplayController';

const router = Router();

/**
 * Roleplay Routes
 */

// All routes require authentication
router.use(authenticate);

router.post('/start', startSession);
router.post('/message', sendMessage);
router.post('/end', endSession);
router.get('/session/:sessionId', getSession);
router.get('/history', getHistory);

export default router;

