import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateFeedback,
  getFeedbackBySession,
} from '../controllers/feedbackController';

const router = Router();

/**
 * Feedback Routes
 */

// All routes require authentication
router.use(authenticate);

router.post('/generate', generateFeedback);
router.get('/:sessionId', getFeedbackBySession);

export default router;

