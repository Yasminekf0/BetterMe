import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { Request } from 'express';

/**
 * Operation Log Service
 * Records all admin operations for audit trail
 */

export enum OperationType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  TEST = 'TEST',
}

export enum TargetType {
  USER = 'USER',
  SCENARIO = 'SCENARIO',
  SETTING = 'SETTING',
  AI_MODEL = 'AI_MODEL',
  PERSONA_TEMPLATE = 'PERSONA_TEMPLATE',
  SESSION = 'SESSION',
  FEEDBACK = 'FEEDBACK',
  ARTICLE = 'ARTICLE',
  NOTIFICATION = 'NOTIFICATION',
  ORDER = 'ORDER',
  MEMBERSHIP = 'MEMBERSHIP',
  PLUGIN = 'PLUGIN',
  MEDIA = 'MEDIA',
  ROLE = 'ROLE',
  LANGUAGE = 'LANGUAGE',
}

interface LogOperationParams {
  userId: string;
  operationType: OperationType | string;
  targetType: TargetType | string;
  targetId?: string;
  description: string;
  details?: Record<string, unknown>;
  req?: Request;
}

/**
 * Log an operation to the database
 */
export async function logOperation(params: LogOperationParams): Promise<void> {
  try {
    const { userId, operationType, targetType, targetId, description, details, req } = params;

    // Extract IP address and user agent from request
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (req) {
      ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
        || req.socket.remoteAddress 
        || undefined;
      userAgent = req.headers['user-agent'];
    }

    await prisma.operationLog.create({
      data: {
        userId,
        operationType,
        targetType,
        targetId,
        description,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress,
        userAgent,
      },
    });

    logger.debug('Operation logged', {
      userId,
      operationType,
      targetType,
      targetId,
      description,
    });
  } catch (error) {
    // Don't throw - logging should not break main functionality
    logger.error('Failed to log operation', { error, params });
  }
}

/**
 * Get operation logs with filters and pagination
 */
export async function getOperationLogs(options: {
  page?: number;
  pageSize?: number;
  userId?: string;
  operationType?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const {
    page = 1,
    pageSize = 20,
    userId,
    operationType,
    targetType,
    startDate,
    endDate,
  } = options;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Record<string, unknown> = {};
  
  if (userId) {
    where.userId = userId;
  }
  
  if (operationType) {
    where.operationType = operationType;
  }
  
  if (targetType) {
    where.targetType = targetType;
  }
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      (where.createdAt as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.createdAt as Record<string, Date>).lte = endDate;
    }
  }

  const [items, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.operationLog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get recent operations for a specific user
 */
export async function getUserRecentOperations(userId: string, limit: number = 10) {
  return prisma.operationLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Clean up old operation logs (retention policy)
 * Keeps logs for the specified number of days
 */
export async function cleanupOldLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.operationLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  logger.info('Old operation logs cleaned up', {
    deletedCount: result.count,
    cutoffDate,
  });

  return result.count;
}

export default {
  logOperation,
  getOperationLogs,
  getUserRecentOperations,
  cleanupOldLogs,
  OperationType,
  TargetType,
};

