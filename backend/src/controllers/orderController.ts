import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import orderService from '../services/orderService';
import { logOperation, OperationType, TargetType } from '../services/operationLogService';

/**
 * Order Controller
 * Handles order management
 */

// ==================== Admin Order Management ====================

export async function getOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, userId, status, orderType, search, startDate, endDate } = req.query;
    const result = await orderService.getAllOrders({
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      userId: userId as string,
      status: status as any,
      orderType: orderType as any,
      search: search as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get orders error', { error });
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
}

export async function getOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.getOrder(id);
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Get order error', { error });
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, paymentMethod, transactionId } = req.body;
    const order = await orderService.updateOrderStatus(id, { status, paymentMethod, transactionId });
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.ORDER,
      targetId: id,
      description: `Updated order status: ${order.orderNo} to ${status}`,
      req,
    });
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Update order status error', { error });
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
}

export async function cancelOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.cancelOrder(id);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.ORDER,
      targetId: id,
      description: `Cancelled order: ${order.orderNo}`,
      req,
    });
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Cancel order error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to cancel order' });
  }
}

export async function refundOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.refundOrder(id);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.ORDER,
      targetId: id,
      description: `Refunded order: ${order.orderNo}`,
      req,
    });
    res.json({ success: true, data: order });
  } catch (error: any) {
    logger.error('Refund order error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to refund order' });
  }
}

export async function getOrderStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query;
    const stats = await orderService.getOrderStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get order stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get order stats' });
  }
}

// ==================== User Orders ====================

export async function getUserOrders(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, status } = req.query;
    const result = await orderService.getUserOrders(req.user!.id, {
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      status: status as any,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get user orders error', { error });
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
}

export async function getUserOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.getOrder(id);
    if (!order || order.userId !== req.user!.id) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Get user order error', { error });
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
}

export async function createUserOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const order = await orderService.createOrder({
      ...req.body,
      userId: req.user!.id,
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error('Create user order error', { error });
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
}

export async function cancelUserOrder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await orderService.getOrder(id);
    if (!order || order.userId !== req.user!.id) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    const result = await orderService.cancelOrder(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Cancel user order error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to cancel order' });
  }
}

