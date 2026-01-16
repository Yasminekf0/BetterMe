import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import notificationService from '../services/notificationService';
import { logOperation, OperationType, TargetType } from '../services/operationLogService';

/**
 * Notification Controller
 * Handles notification management
 */

// ==================== Admin Notifications ====================

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, type, search } = req.query;
    const result = await notificationService.getAllNotifications({
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      type: type as any,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get notifications error', { error });
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
}

export async function getNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const notification = await notificationService.getNotification(id);
    if (!notification) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Get notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to get notification' });
  }
}

export async function createNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const notification = await notificationService.createNotification({
      ...req.body,
      createdById: req.user!.id,
    });
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.NOTIFICATION,
      targetId: notification.id,
      description: `Created notification: ${notification.title}`,
      req,
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    logger.error('Create notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
}

export async function updateNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const notification = await notificationService.updateNotification(id, req.body);
    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Update notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
}

export async function deleteNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
}

export async function sendNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await notificationService.sendNotification(id);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.NOTIFICATION,
      targetId: id,
      description: `Sent notification to ${result.recipientCount} users`,
      req,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Send notification error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to send notification' });
  }
}

export async function getNotificationStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await notificationService.getNotificationStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get notification stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get notification stats' });
  }
}

// ==================== User Notifications ====================

export async function getUserNotifications(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user!.id, {
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get user notifications error', { error });
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
}

export async function markNotificationAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await notificationService.markNotificationAsRead(req.user!.id, id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark notification as read error', { error });
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
}

export async function markAllNotificationsAsRead(req: AuthRequest, res: Response): Promise<void> {
  try {
    const count = await notificationService.markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Mark all notifications as read error', { error });
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
}

export async function deleteUserNotification(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await notificationService.deleteUserNotification(req.user!.id, id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete user notification error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
}

