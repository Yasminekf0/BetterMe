import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { PointType } from '@prisma/client';

/**
 * Membership Service
 * Manages membership plans and points system
 */

// ==================== Membership Plans ====================

export async function getAllMembershipPlans(options?: { includeInactive?: boolean }) {
  try {
    const where: Record<string, unknown> = {};
    if (!options?.includeInactive) where.isActive = true;

    return await prisma.membershipPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    });
  } catch (error) {
    logger.error('Get all membership plans error', { error });
    throw error;
  }
}

export async function getMembershipPlan(idOrSlug: string) {
  try {
    return await prisma.membershipPlan.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
  } catch (error) {
    logger.error('Get membership plan error', { error, idOrSlug });
    throw error;
  }
}

export async function createMembershipPlan(data: {
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  duration: number;
  features: Record<string, unknown>;
  limits?: Record<string, unknown>;
  isFeatured?: boolean;
  sortOrder?: number;
}) {
  try {
    const existing = await prisma.membershipPlan.findUnique({ where: { slug: data.slug } });
    if (existing) throw new Error('Slug already exists');

    const plan = await prisma.membershipPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        currency: data.currency ?? 'USD',
        duration: data.duration,
        features: JSON.parse(JSON.stringify(data.features)),
        limits: data.limits ? JSON.parse(JSON.stringify(data.limits)) : undefined,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    logger.info('Membership plan created', { planId: plan.id });
    return plan;
  } catch (error) {
    logger.error('Create membership plan error', { error });
    throw error;
  }
}

export async function updateMembershipPlan(id: string, data: Partial<{
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  currency: string;
  duration: number;
  features: Record<string, unknown>;
  limits: Record<string, unknown>;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}>) {
  try {
    if (data.slug) {
      const existing = await prisma.membershipPlan.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) throw new Error('Slug already exists');
    }

    // Convert Record types to JSON-compatible format
    const updateData: Record<string, unknown> = { ...data };
    if (data.features) {
      updateData.features = JSON.parse(JSON.stringify(data.features));
    }
    if (data.limits) {
      updateData.limits = JSON.parse(JSON.stringify(data.limits));
    }

    const plan = await prisma.membershipPlan.update({ where: { id }, data: updateData });
    logger.info('Membership plan updated', { planId: id });
    return plan;
  } catch (error) {
    logger.error('Update membership plan error', { error, id });
    throw error;
  }
}

export async function deleteMembershipPlan(id: string) {
  try {
    // Check if any users have this plan
    const usersCount = await prisma.user.count({ where: { membershipId: id } });
    if (usersCount > 0) {
      throw new Error('Cannot delete plan with active subscribers');
    }

    await prisma.membershipPlan.delete({ where: { id } });
    logger.info('Membership plan deleted', { planId: id });
    return true;
  } catch (error) {
    logger.error('Delete membership plan error', { error, id });
    throw error;
  }
}

export async function getMembershipStats() {
  try {
    const [plansCount, activeSubscribers, planStats] = await Promise.all([
      prisma.membershipPlan.count({ where: { isActive: true } }),
      prisma.user.count({ where: { membershipId: { not: null }, membershipExpireAt: { gt: new Date() } } }),
      prisma.user.groupBy({
        by: ['membershipId'],
        where: { membershipId: { not: null } },
        _count: { id: true },
      }),
    ]);

    // Get plan details for stats
    const planIds = planStats.map(s => s.membershipId).filter(Boolean) as string[];
    const plans = await prisma.membershipPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planStatsWithNames = planStats.map(s => ({
      planId: s.membershipId,
      planName: plans.find(p => p.id === s.membershipId)?.name || 'Unknown',
      count: s._count.id,
    }));

    return { plansCount, activeSubscribers, byPlan: planStatsWithNames };
  } catch (error) {
    logger.error('Get membership stats error', { error });
    throw error;
  }
}

// ==================== Points Configuration ====================

export async function getAllPointsConfigs() {
  try {
    return await prisma.pointsConfig.findMany({
      orderBy: { key: 'asc' },
    });
  } catch (error) {
    logger.error('Get all points configs error', { error });
    throw error;
  }
}

export async function getPointsConfig(key: string) {
  try {
    return await prisma.pointsConfig.findUnique({ where: { key } });
  } catch (error) {
    logger.error('Get points config error', { error, key });
    throw error;
  }
}

export async function upsertPointsConfig(data: {
  key: string;
  name: string;
  description?: string;
  points: number;
  isEnabled?: boolean;
  dailyLimit?: number;
  totalLimit?: number;
}) {
  try {
    const config = await prisma.pointsConfig.upsert({
      where: { key: data.key },
      update: {
        name: data.name,
        description: data.description,
        points: data.points,
        isEnabled: data.isEnabled,
        dailyLimit: data.dailyLimit,
        totalLimit: data.totalLimit,
      },
      create: {
        key: data.key,
        name: data.name,
        description: data.description,
        points: data.points,
        isEnabled: data.isEnabled ?? true,
        dailyLimit: data.dailyLimit,
        totalLimit: data.totalLimit,
      },
    });

    logger.info('Points config upserted', { key: data.key });
    return config;
  } catch (error) {
    logger.error('Upsert points config error', { error, key: data.key });
    throw error;
  }
}

export async function deletePointsConfig(key: string) {
  try {
    await prisma.pointsConfig.delete({ where: { key } });
    logger.info('Points config deleted', { key });
    return true;
  } catch (error) {
    logger.error('Delete points config error', { error, key });
    throw error;
  }
}

// Default points configurations
const DEFAULT_POINTS_CONFIGS = [
  { key: 'daily_login', name: 'Daily Login', points: 10, description: 'Points for daily login' },
  { key: 'complete_practice', name: 'Complete Practice', points: 20, description: 'Points for completing a practice session' },
  { key: 'high_score', name: 'High Score Bonus', points: 50, description: 'Bonus points for scoring 90+' },
  { key: 'invite_user', name: 'Invite User', points: 100, description: 'Points for inviting a new user' },
  { key: 'share_feedback', name: 'Share Feedback', points: 15, description: 'Points for sharing feedback' },
];

export async function initializePointsConfigs() {
  try {
    for (const config of DEFAULT_POINTS_CONFIGS) {
      const existing = await prisma.pointsConfig.findUnique({ where: { key: config.key } });
      if (!existing) {
        await prisma.pointsConfig.create({ data: config });
      }
    }
    logger.info('Points configs initialized');
  } catch (error) {
    logger.error('Initialize points configs error', { error });
  }
}

// ==================== User Points ====================

export async function getUserPoints(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    return user?.points ?? 0;
  } catch (error) {
    logger.error('Get user points error', { error, userId });
    throw error;
  }
}

export async function addPoints(userId: string, data: {
  points: number;
  type: PointType;
  description: string;
  relatedId?: string;
}) {
  try {
    // Get current balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) throw new Error('User not found');

    const newBalance = user.points + data.points;

    // Update user points and create record
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: newBalance },
      }),
      prisma.pointRecord.create({
        data: {
          userId,
          points: data.points,
          balance: newBalance,
          type: data.type,
          description: data.description,
          relatedId: data.relatedId,
        },
      }),
    ]);

    logger.info('Points added', { userId, points: data.points, newBalance });
    return { points: data.points, balance: newBalance };
  } catch (error) {
    logger.error('Add points error', { error, userId });
    throw error;
  }
}

export async function deductPoints(userId: string, data: {
  points: number;
  description: string;
  relatedId?: string;
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) throw new Error('User not found');
    if (user.points < data.points) throw new Error('Insufficient points');

    const newBalance = user.points - data.points;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: newBalance },
      }),
      prisma.pointRecord.create({
        data: {
          userId,
          points: -data.points,
          balance: newBalance,
          type: 'SPEND',
          description: data.description,
          relatedId: data.relatedId,
        },
      }),
    ]);

    logger.info('Points deducted', { userId, points: data.points, newBalance });
    return { points: data.points, balance: newBalance };
  } catch (error) {
    logger.error('Deduct points error', { error, userId });
    throw error;
  }
}

export async function getPointRecords(userId: string, options: {
  page?: number;
  pageSize?: number;
  type?: PointType;
}) {
  try {
    const { page = 1, pageSize = 20, type } = options;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.pointRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pointRecord.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    logger.error('Get point records error', { error, userId });
    throw error;
  }
}

export default {
  // Membership Plans
  getAllMembershipPlans,
  getMembershipPlan,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  getMembershipStats,
  // Points Config
  getAllPointsConfigs,
  getPointsConfig,
  upsertPointsConfig,
  deletePointsConfig,
  initializePointsConfigs,
  // User Points
  getUserPoints,
  addPoints,
  deductPoints,
  getPointRecords,
};

