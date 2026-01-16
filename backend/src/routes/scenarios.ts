import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import {
  getScenarios,
  getScenarioById,
  getRecommendedScenarios,
} from '../controllers/scenarioController';

const router = Router();

/**
 * Scenario Routes
 */

// Public/Semi-public routes (optionalAuth for personalization)
router.get('/', optionalAuth, getScenarios);
router.get('/recommended', authenticate, getRecommendedScenarios);
router.get('/:id', optionalAuth, getScenarioById);

export default router;

