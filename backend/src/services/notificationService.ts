import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { NotificationType, NotificationTarget } from '@prisma/client';

/**
 * Notification Service
 * Manages system notifications and user notifications
 */

// ==================== Admin Notifications ====================

export async function getAllNotifications(options: {
  page?: number;
  pageSize?: number;
  type?: NotificationType;
  search?: string;
}) {
  try {
    const { page = 1, pageSize = 20, type, search } = options;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    logger.error('Get all notifications error', { error });
    throw error;
  }
}

export async function getNotification(id: string) {
  try {
    return await prisma.notification.findUnique({
      where: { id },
      include: {
        userNotifications: {
          include: { user: { select: { id: true, name: true, email: true } } },
          take: 10,
        },
      },
    });
  } catch (error) {
    logger.error('Get notification error', { error, id });
    throw error;
  }
}

export async function createNotification(data: {
  title: string;
  content: string;
  type: NotificationType;
  targetType: NotificationTarget;
  targetIds?: string[];
  sendAt?: Date;
  metadata?: Record<string, unknown>;
  createdById?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        targetType: data.targetType,
        targetIds: data.targetIds ?? [],
        sendAt: data.sendAt,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        createdById: data.createdById,
      },
    });

    // If no scheduled time, send immediately
    if (!data.sendAt) {
      await sendNotification(notification.id);
    }

    logger.info('Notification created', { notificationId: notification.id });
    return notification;
  } catch (error) {
    logger.error('Create notification error', { error });
    throw error;
  }
}

export async function updateNotification(id: string, data: Partial<{
  title: string;
  content: string;
  type: NotificationType;
  targetType: NotificationTarget;
  targetIds: string[];
  sendAt: Date | null;
  metadata: Record<string, unknown>;
}>) {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.metadata) {
      updateData.metadata = JSON.parse(JSON.stringify(data.metadata));
    }
    const notification = await prisma.notification.update({ where: { id }, data: updateData });
    logger.info('Notification updated', { notificationId: id });
    return notification;
  } catch (error) {
    logger.error('Update notification error', { error, id });
    throw error;
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({ where: { id } });
    logger.info('Notification deleted', { notificationId: id });
    return true;
  } catch (error) {
    logger.error('Delete notification error', { error, id });
    throw error;
  }
}

export async function sendNotification(notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new Error('Notification not found');
    if (notification.sentAt) throw new Error('Notification already sent');

    // Get target users based on target type
    let userIds: string[] = [];

    if (notification.targetType === 'ALL') {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map(u => u.id);
    } else if (notification.targetType === 'SPECIFIC') {
      userIds = notification.targetIds;
    } else if (notification.targetType === 'ROLE') {
      // targetIds contains role names
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: notification.targetIds as any[] },
        },
        select: { id: true },
      });
      userIds = users.map(u => u.id);
    }

    // Create user notifications
    if (userIds.length > 0) {
      await prisma.userNotification.createMany({
        data: userIds.map(userId => ({
          userId,
          notificationId,
        })),
        skipDuplicates: true,
      });
    }

    // Mark notification as sent
    await prisma.notification.update({
      where: { id: notificationId },
      data: { sentAt: new Date() },
    });

    logger.info('Notification sent', { notificationId, recipientCount: userIds.length });
    return { success: true, recipientCount: userIds.length };
  } catch (error) {
    logger.error('Send notification error', { error, notificationId });
    throw error;
  }
}

// ==================== User Notifications ====================

export async function getUserNotifications(userId: string, options: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}) {
  try {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = { userId };

    if (unreadOnly) where.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          notification: {
            select: { id: true, title: true, content: true, type: true, createdAt: true },
          },
        },
      }),
      prisma.userNotification.count({ where }),
      prisma.userNotification.count({ where: { userId, isRead: false } }),
    ]);

    return { items, total, unreadCount, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    logger.error('Get user notifications error', { error, userId });
    throw error;
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  try {
    await prisma.userNotification.update({
      where: { userId_notificationId: { userId, notificationId } },
      data: { isRead: true, readAt: new Date() },
    });
    logger.info('Notification marked as read', { userId, notificationId });
    return true;
  } catch (error) {
    logger.error('Mark notification as read error', { error, userId, notificationId });
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    logger.info('All notifications marked as read', { userId, count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Mark all notifications as read error', { error, userId });
    throw error;
  }
}

export async function deleteUserNotification(userId: string, notificationId: string) {
  try {
    await prisma.userNotification.delete({
      where: { userId_notificationId: { userId, notificationId } },
    });
    logger.info('User notification deleted', { userId, notificationId });
    return true;
  } catch (error) {
    logger.error('Delete user notification error', { error, userId, notificationId });
    throw error;
  }
}

export async function getNotificationStats() {
  try {
    const [totalCount, sentCount, scheduledCount] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { sentAt: { not: null } } }),
      prisma.notification.count({ where: { sentAt: null, sendAt: { not: null } } }),
    ]);

    const typeStats = await prisma.notification.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    return {
      totalCount,
      sentCount,
      scheduledCount,
      byType: typeStats.map(s => ({ type: s.type, count: s._count.id })),
    };
  } catch (error) {
    logger.error('Get notification stats error', { error });
    throw error;
  }
}

export default {
  getAllNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  getNotificationStats,
};

