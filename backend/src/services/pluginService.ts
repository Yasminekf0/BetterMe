import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { PluginCategory } from '@prisma/client';

/**
 * Plugin Service
 * Manages plugin marketplace and installations
 */

// Default plugins for the AI training system
export const DEFAULT_PLUGINS = [
  {
    slug: 'ai-conversation-analyzer',
    name: 'AI Conversation Analyzer',
    description: 'Analyze sales conversations using AI to identify patterns, strengths, and areas for improvement.',
    icon: '🔍',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'AI_TOOLS' as PluginCategory,
    price: 0,
    permissions: ['read:sessions', 'read:feedback'],
    screenshots: [],
  },
  {
    slug: 'scenario-builder-pro',
    name: 'Scenario Builder Pro',
    description: 'Advanced scenario creation with AI-assisted persona generation and objection suggestions.',
    icon: '🎭',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'PRODUCTIVITY' as PluginCategory,
    price: 0,
    permissions: ['write:scenarios', 'read:personas'],
    screenshots: [],
  },
  {
    slug: 'performance-analytics',
    name: 'Performance Analytics',
    description: 'Advanced analytics dashboard with team comparisons, trend analysis, and custom reports.',
    icon: '📊',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'ANALYTICS' as PluginCategory,
    price: 0,
    permissions: ['read:statistics', 'read:users'],
    screenshots: [],
  },
  {
    slug: 'email-template-library',
    name: 'Email Template Library',
    description: 'Library of professional follow-up email templates for various sales scenarios.',
    icon: '📧',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'CONTENT' as PluginCategory,
    price: 0,
    permissions: ['read:emails', 'write:emails'],
    screenshots: [],
  },
  {
    slug: 'team-collaboration',
    name: 'Team Collaboration',
    description: 'Share feedback, discuss practice sessions, and collaborate with team members.',
    icon: '👥',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'COMMUNICATION' as PluginCategory,
    price: 0,
    permissions: ['read:users', 'write:notifications'],
    screenshots: [],
  },
  {
    slug: 'crm-integration',
    name: 'CRM Integration',
    description: 'Sync practice data and insights with your CRM system (Salesforce, HubSpot, etc).',
    icon: '🔗',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'INTEGRATION' as PluginCategory,
    price: 0,
    permissions: ['read:sessions', 'read:feedback'],
    screenshots: [],
  },
  {
    slug: 'voice-roleplay',
    name: 'Voice Roleplay',
    description: 'Practice sales conversations with voice input and speech recognition.',
    icon: '🎤',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'AI_TOOLS' as PluginCategory,
    price: 0,
    permissions: ['write:sessions', 'read:scenarios'],
    screenshots: [],
  },
  {
    slug: 'gamification',
    name: 'Gamification',
    description: 'Add badges, leaderboards, and achievements to motivate sales teams.',
    icon: '🏆',
    version: '1.0.0',
    author: 'Master Trainer',
    category: 'PRODUCTIVITY' as PluginCategory,
    price: 0,
    permissions: ['read:users', 'read:statistics'],
    screenshots: [],
  },
];

/**
 * Get all plugins with pagination and filters
 */
export async function getAllPlugins(options: {
  page?: number;
  pageSize?: number;
  category?: PluginCategory;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}) {
  try {
    const { page = 1, pageSize = 20, category, isActive, isFeatured, search } = options;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.plugin.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ isFeatured: 'desc' }, { downloadCount: 'desc' }],
        include: {
          installations: {
            select: { id: true, isEnabled: true },
          },
        },
      }),
      prisma.plugin.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        isInstalled: item.installations.length > 0,
        isEnabled: item.installations[0]?.isEnabled ?? false,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Get all plugins error', { error });
    throw error;
  }
}

/**
 * Get plugin by ID or slug
 */
export async function getPlugin(idOrSlug: string) {
  try {
    const plugin = await prisma.plugin.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        installations: true,
      },
    });

    if (plugin) {
      return {
        ...plugin,
        isInstalled: plugin.installations.length > 0,
        isEnabled: plugin.installations[0]?.isEnabled ?? false,
      };
    }

    return null;
  } catch (error) {
    logger.error('Get plugin error', { error, idOrSlug });
    throw error;
  }
}

/**
 * Create plugin
 */
export async function createPlugin(data: {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  version?: string;
  author?: string;
  category: PluginCategory;
  price?: number;
  permissions?: string[];
  dependencies?: string[];
  config?: Record<string, unknown>;
  screenshots?: string[];
  documentation?: string;
}) {
  try {
    const plugin = await prisma.plugin.create({
      data: {
        slug: data.slug,
        name: data.name,
        description: data.description,
        icon: data.icon,
        version: data.version ?? '1.0.0',
        author: data.author,
        category: data.category,
        price: data.price ?? 0,
        permissions: data.permissions ?? [],
        dependencies: data.dependencies ?? [],
        config: data.config ? JSON.parse(JSON.stringify(data.config)) : undefined,
        screenshots: data.screenshots ?? [],
        documentation: data.documentation,
      },
    });

    logger.info('Plugin created', { pluginId: plugin.id, slug: plugin.slug });
    return plugin;
  } catch (error) {
    logger.error('Create plugin error', { error, slug: data.slug });
    throw error;
  }
}

/**
 * Update plugin
 */
export async function updatePlugin(id: string, data: Partial<{
  name: string;
  description: string;
  icon: string;
  version: string;
  author: string;
  category: PluginCategory;
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  permissions: string[];
  dependencies: string[];
  config: Record<string, unknown>;
  screenshots: string[];
  documentation: string;
  changelog: unknown;
}>) {
  try {
    const updateData: Record<string, unknown> = { ...data };
    if (data.config) {
      updateData.config = JSON.parse(JSON.stringify(data.config));
    }
    if (data.changelog) {
      updateData.changelog = JSON.parse(JSON.stringify(data.changelog));
    }
    const plugin = await prisma.plugin.update({
      where: { id },
      data: updateData,
    });

    logger.info('Plugin updated', { pluginId: id });
    return plugin;
  } catch (error) {
    logger.error('Update plugin error', { error, id });
    throw error;
  }
}

/**
 * Delete plugin
 */
export async function deletePlugin(id: string) {
  try {
    await prisma.plugin.delete({
      where: { id },
    });

    logger.info('Plugin deleted', { pluginId: id });
    return true;
  } catch (error) {
    logger.error('Delete plugin error', { error, id });
    throw error;
  }
}

/**
 * Install plugin
 */
export async function installPlugin(pluginId: string, config?: Record<string, unknown>) {
  try {
    // Check if plugin exists
    const plugin = await prisma.plugin.findUnique({
      where: { id: pluginId },
    });

    if (!plugin) {
      throw new Error('Plugin not found');
    }

    // Check if already installed
    const existing = await prisma.pluginInstallation.findUnique({
      where: { pluginId },
    });

    if (existing) {
      throw new Error('Plugin already installed');
    }

    // Create installation
    const installation = await prisma.pluginInstallation.create({
      data: {
        pluginId,
        config: config ? JSON.parse(JSON.stringify(config)) : undefined,
        isEnabled: true,
      },
    });

    // Increment download count
    await prisma.plugin.update({
      where: { id: pluginId },
      data: { downloadCount: { increment: 1 } },
    });

    logger.info('Plugin installed', { pluginId });
    return installation;
  } catch (error) {
    logger.error('Install plugin error', { error, pluginId });
    throw error;
  }
}

/**
 * Uninstall plugin
 */
export async function uninstallPlugin(pluginId: string) {
  try {
    await prisma.pluginInstallation.delete({
      where: { pluginId },
    });

    logger.info('Plugin uninstalled', { pluginId });
    return true;
  } catch (error) {
    logger.error('Uninstall plugin error', { error, pluginId });
    throw error;
  }
}

/**
 * Toggle plugin installation status
 */
export async function togglePluginStatus(pluginId: string) {
  try {
    const installation = await prisma.pluginInstallation.findUnique({
      where: { pluginId },
    });

    if (!installation) {
      throw new Error('Plugin not installed');
    }

    const updated = await prisma.pluginInstallation.update({
      where: { pluginId },
      data: { isEnabled: !installation.isEnabled },
    });

    logger.info('Plugin status toggled', { pluginId, isEnabled: updated.isEnabled });
    return updated;
  } catch (error) {
    logger.error('Toggle plugin status error', { error, pluginId });
    throw error;
  }
}

/**
 * Update plugin configuration
 */
export async function updatePluginConfig(pluginId: string, config: Record<string, unknown>) {
  try {
    const installation = await prisma.pluginInstallation.update({
      where: { pluginId },
      data: { config: JSON.parse(JSON.stringify(config)) },
    });

    logger.info('Plugin config updated', { pluginId });
    return installation;
  } catch (error) {
    logger.error('Update plugin config error', { error, pluginId });
    throw error;
  }
}

/**
 * Get installed plugins
 */
export async function getInstalledPlugins() {
  try {
    const installations = await prisma.pluginInstallation.findMany({
      include: {
        plugin: true,
      },
      orderBy: { installedAt: 'desc' },
    });

    return installations;
  } catch (error) {
    logger.error('Get installed plugins error', { error });
    throw error;
  }
}

/**
 * Get enabled plugins
 */
export async function getEnabledPlugins() {
  try {
    const installations = await prisma.pluginInstallation.findMany({
      where: { isEnabled: true },
      include: {
        plugin: true,
      },
    });

    return installations;
  } catch (error) {
    logger.error('Get enabled plugins error', { error });
    throw error;
  }
}

/**
 * Initialize default plugins
 */
export async function initializeDefaultPlugins() {
  try {
    for (const pluginData of DEFAULT_PLUGINS) {
      const existing = await prisma.plugin.findUnique({
        where: { slug: pluginData.slug },
      });

      if (!existing) {
        await prisma.plugin.create({
          data: {
            ...pluginData,
            isActive: true,
          },
        });
      }
    }

    logger.info('Default plugins initialized');
  } catch (error) {
    logger.error('Initialize default plugins error', { error });
  }
}

export default {
  DEFAULT_PLUGINS,
  getAllPlugins,
  getPlugin,
  createPlugin,
  updatePlugin,
  deletePlugin,
  installPlugin,
  uninstallPlugin,
  togglePluginStatus,
  updatePluginConfig,
  getInstalledPlugins,
  getEnabledPlugins,
  initializeDefaultPlugins,
};

