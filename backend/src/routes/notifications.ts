import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth';
import {
  // Admin
  getNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
  getNotificationStats,
  // User
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== User Notification Routes ====================
router.get('/my', getUserNotifications);
router.put('/my/read-all', markAllNotificationsAsRead);
router.put('/my/:id/read', markNotificationAsRead);
router.delete('/my/:id', deleteUserNotification);

// ==================== Admin Notification Routes ====================
router.get('/', adminOnly, getNotifications);
router.get('/stats', adminOnly, getNotificationStats);
router.get('/:id', adminOnly, getNotification);
router.post('/', adminOnly, createNotification);
router.put('/:id', adminOnly, updateNotification);
router.delete('/:id', adminOnly, deleteNotification);
router.post('/:id/send', adminOnly, sendNotification);

export default router;

