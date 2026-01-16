import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateEmail,
  updateEmail,
  getEmailBySession,
} from '../controllers/emailController';

const router = Router();

/**
 * Email Routes
 */

// All routes require authentication
router.use(authenticate);

router.post('/generate', generateEmail);
router.put('/:id', updateEmail);
router.get('/:sessionId', getEmailBySession);

export default router;

