import { Router } from 'express';
import authRoutes from './auth';
import scenarioRoutes from './scenarios';
import roleplayRoutes from './roleplay';
import feedbackRoutes from './feedback';
import emailRoutes from './email';
import adminRoutes from './admin';
import statisticsRoutes from './statistics';
import systemRoutes from './system';
import articleRoutes from './articles';
import notificationRoutes from './notifications';
import orderRoutes from './orders';
import ragRoutes from './rag';
import conversationRoutes from './conversations';

const router = Router();

/**
 * API Routes
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Master Trainer API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/roleplay', roleplayRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/email', emailRoutes);
router.use('/admin', adminRoutes);
router.use('/statistics', statisticsRoutes);

// New module routes
router.use('/system', systemRoutes);
router.use('/articles', articleRoutes);
router.use('/notifications', notificationRoutes);
router.use('/orders', orderRoutes);
router.use('/conversations', conversationRoutes);

// RAG routes (admin) / RAG路由（管理员）
router.use('/admin/rag', ragRoutes);

export default router;

