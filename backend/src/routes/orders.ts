import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth';
import {
  // Admin
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  refundOrder,
  getOrderStats,
  // User
  getUserOrders,
  getUserOrder,
  createUserOrder,
  cancelUserOrder,
} from '../controllers/orderController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== User Order Routes ====================
router.get('/my', getUserOrders);
router.get('/my/:id', getUserOrder);
router.post('/my', createUserOrder);
router.put('/my/:id/cancel', cancelUserOrder);

// ==================== Admin Order Routes ====================
router.get('/', adminOnly, getOrders);
router.get('/stats', adminOnly, getOrderStats);
router.get('/:id', adminOnly, getOrder);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/cancel', adminOnly, cancelOrder);
router.put('/:id/refund', adminOnly, refundOrder);

export default router;

