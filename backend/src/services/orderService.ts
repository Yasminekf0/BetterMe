import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { OrderType, OrderStatus, PaymentProvider } from '@prisma/client';
import crypto from 'crypto';

/**
 * Order Service
 * Manages orders and order processing
 */

/**
 * Generate unique order number
 */
function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD${timestamp}${random}`;
}

export async function getAllOrders(options: {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const { page = 1, pageSize = 20, userId, status, orderType, search, startDate, endDate } = options;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    logger.error('Get all orders error', { error });
    throw error;
  }
}

export async function getOrder(idOrOrderNo: string) {
  try {
    return await prisma.order.findFirst({
      where: {
        OR: [{ id: idOrOrderNo }, { orderNo: idOrOrderNo }],
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  } catch (error) {
    logger.error('Get order error', { error, idOrOrderNo });
    throw error;
  }
}

export async function createOrder(data: {
  userId: string;
  orderType: OrderType;
  amount: number;
  currency?: string;
  productId?: string;
  productName: string;
  productDesc?: string;
  metadata?: Record<string, unknown>;
  expiredAt?: Date;
}) {
  try {
    const order = await prisma.order.create({
      data: {
        orderNo: generateOrderNo(),
        userId: data.userId,
        orderType: data.orderType,
        amount: data.amount,
        currency: data.currency ?? 'USD',
        productId: data.productId,
        productName: data.productName,
        productDesc: data.productDesc,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        status: 'PENDING',
        expiredAt: data.expiredAt ?? new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    logger.info('Order created', { orderId: order.id, orderNo: order.orderNo });
    return order;
  } catch (error) {
    logger.error('Create order error', { error });
    throw error;
  }
}

export async function updateOrderStatus(id: string, data: {
  status: OrderStatus;
  paymentMethod?: PaymentProvider;
  transactionId?: string;
}) {
  try {
    const updateData: Record<string, unknown> = { status: data.status };

    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.transactionId) updateData.transactionId = data.transactionId;

    if (data.status === 'PAID') {
      updateData.paidAt = new Date();
    } else if (data.status === 'REFUNDED') {
      updateData.refundedAt = new Date();
    }

    const order = await prisma.order.update({ where: { id }, data: updateData });
    logger.info('Order status updated', { orderId: id, status: data.status });
    return order;
  } catch (error) {
    logger.error('Update order status error', { error, id });
    throw error;
  }
}

export async function completeOrder(orderNo: string, data: {
  paymentMethod: PaymentProvider;
  transactionId: string;
}) {
  try {
    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error('Order is not pending');

    const updatedOrder = await prisma.order.update({
      where: { orderNo },
      data: {
        status: 'PAID',
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        paidAt: new Date(),
      },
    });

    // Process order based on type
    await processOrderCompletion(updatedOrder);

    logger.info('Order completed', { orderId: order.id, orderNo });
    return updatedOrder;
  } catch (error) {
    logger.error('Complete order error', { error, orderNo });
    throw error;
  }
}

async function processOrderCompletion(order: {
  id: string;
  userId: string;
  orderType: OrderType;
  productId: string | null;
  amount: number;
}) {
  try {
    if (order.orderType === 'MEMBERSHIP' && order.productId) {
      // Update user membership
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: order.productId },
      });

      if (plan) {
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + plan.duration);

        await prisma.user.update({
          where: { id: order.userId },
          data: {
            membershipId: plan.id,
            membershipExpireAt: expireAt,
          },
        });
      }
    } else if (order.orderType === 'POINTS') {
      // Add points to user (implementation depends on points config)
      // This is a placeholder - actual points value would come from product/config
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETED' },
    });
  } catch (error) {
    logger.error('Process order completion error', { error, orderId: order.id });
  }
}

export async function cancelOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error('Only pending orders can be cancelled');

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    logger.info('Order cancelled', { orderId: id });
    return updated;
  } catch (error) {
    logger.error('Cancel order error', { error, id });
    throw error;
  }
}

export async function refundOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PAID' && order.status !== 'COMPLETED') {
      throw new Error('Only paid or completed orders can be refunded');
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });

    // TODO: Process refund with payment provider
    // TODO: Revoke membership/points if applicable

    logger.info('Order refunded', { orderId: id });
    return updated;
  } catch (error) {
    logger.error('Refund order error', { error, id });
    throw error;
  }
}

export async function getOrderStats(options?: { startDate?: Date; endDate?: Date }) {
  try {
    const where: Record<string, unknown> = {};
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) (where.createdAt as Record<string, unknown>).gte = options.startDate;
      if (options.endDate) (where.createdAt as Record<string, unknown>).lte = options.endDate;
    }

    const [totalCount, paidCount, totalRevenue, statusStats, typeStats] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: { in: ['PAID', 'COMPLETED'] } } }),
      prisma.order.aggregate({
        where: { ...where, status: { in: ['PAID', 'COMPLETED'] } },
        _sum: { amount: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.order.groupBy({
        by: ['orderType'],
        where,
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCount,
      paidCount,
      totalRevenue: totalRevenue._sum.amount || 0,
      byStatus: statusStats.map(s => ({
        status: s.status,
        count: s._count.id,
        amount: s._sum.amount || 0,
      })),
      byType: typeStats.map(t => ({
        type: t.orderType,
        count: t._count.id,
        amount: t._sum.amount || 0,
      })),
    };
  } catch (error) {
    logger.error('Get order stats error', { error });
    throw error;
  }
}

export async function getUserOrders(userId: string, options: {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
}) {
  try {
    return await getAllOrders({ ...options, userId });
  } catch (error) {
    logger.error('Get user orders error', { error, userId });
    throw error;
  }
}

export default {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  completeOrder,
  cancelOrder,
  refundOrder,
  getOrderStats,
  getUserOrders,
};

