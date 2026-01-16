import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { OAuthProvider } from '@prisma/client';

/**
 * Auth Config Service
 * Manages login/registration methods configuration
 */

// Supported OAuth providers with their default settings
export const OAUTH_PROVIDERS = {
  WECHAT: {
    name: 'WeChat',
    icon: 'wechat',
    description: 'Login with WeChat account',
  },
  DINGTALK: {
    name: 'DingTalk',
    icon: 'dingtalk',
    description: 'Login with DingTalk account',
  },
  FEISHU: {
    name: 'Feishu (Lark)',
    icon: 'feishu',
    description: 'Login with Feishu account',
  },
  GOOGLE: {
    name: 'Google',
    icon: 'google',
    description: 'Login with Google account',
  },
  GITHUB: {
    name: 'GitHub',
    icon: 'github',
    description: 'Login with GitHub account',
  },
};

/**
 * Get all login configurations
 */
export async function getAllLoginConfigs() {
  try {
    const configs = await prisma.loginConfig.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return configs;
  } catch (error) {
    logger.error('Get all login configs error', { error });
    return [];
  }
}

/**
 * Get login configuration by provider
 */
export async function getLoginConfig(provider: OAuthProvider) {
  try {
    const config = await prisma.loginConfig.findUnique({
      where: { provider },
    });
    return config;
  } catch (error) {
    logger.error('Get login config error', { error, provider });
    return null;
  }
}

/**
 * Get enabled login configurations
 */
export async function getEnabledLoginConfigs() {
  try {
    const configs = await prisma.loginConfig.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        provider: true,
        name: true,
        isEnabled: true,
        sortOrder: true,
      },
    });
    return configs;
  } catch (error) {
    logger.error('Get enabled login configs error', { error });
    return [];
  }
}

/**
 * Create or update login configuration
 */
export async function upsertLoginConfig(data: {
  provider: OAuthProvider;
  name: string;
  isEnabled?: boolean;
  appId?: string;
  appSecret?: string;
  redirectUri?: string;
  scope?: string;
  config?: Record<string, unknown>;
  sortOrder?: number;
}) {
  try {
    const config = await prisma.loginConfig.upsert({
      where: { provider: data.provider },
      update: {
        name: data.name,
        isEnabled: data.isEnabled ?? false,
        appId: data.appId,
        appSecret: data.appSecret,
        redirectUri: data.redirectUri,
        scope: data.scope,
        config: data.config ? JSON.parse(JSON.stringify(data.config)) : undefined,
        sortOrder: data.sortOrder ?? 0,
      },
      create: {
        provider: data.provider,
        name: data.name,
        isEnabled: data.isEnabled ?? false,
        appId: data.appId,
        appSecret: data.appSecret,
        redirectUri: data.redirectUri,
        scope: data.scope,
        config: data.config ? JSON.parse(JSON.stringify(data.config)) : undefined,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    logger.info('Login config upserted', { provider: data.provider });
    return config;
  } catch (error) {
    logger.error('Upsert login config error', { error, provider: data.provider });
    throw error;
  }
}

/**
 * Toggle login configuration status
 */
export async function toggleLoginConfig(provider: OAuthProvider) {
  try {
    const config = await prisma.loginConfig.findUnique({
      where: { provider },
    });
    
    if (!config) {
      throw new Error('Login config not found');
    }

    const updated = await prisma.loginConfig.update({
      where: { provider },
      data: { isEnabled: !config.isEnabled },
    });
    
    logger.info('Login config toggled', { provider, isEnabled: updated.isEnabled });
    return updated;
  } catch (error) {
    logger.error('Toggle login config error', { error, provider });
    throw error;
  }
}

/**
 * Delete login configuration
 */
export async function deleteLoginConfig(provider: OAuthProvider) {
  try {
    await prisma.loginConfig.delete({
      where: { provider },
    });
    logger.info('Login config deleted', { provider });
    return true;
  } catch (error) {
    logger.error('Delete login config error', { error, provider });
    throw error;
  }
}

/**
 * Initialize default login configurations
 */
export async function initializeLoginConfigs() {
  try {
    for (const [provider, info] of Object.entries(OAUTH_PROVIDERS)) {
      const existing = await prisma.loginConfig.findUnique({
        where: { provider: provider as OAuthProvider },
      });

      if (!existing) {
        await prisma.loginConfig.create({
          data: {
            provider: provider as OAuthProvider,
            name: info.name,
            isEnabled: false,
          },
        });
      }
    }
    logger.info('Login configs initialized');
  } catch (error) {
    logger.error('Initialize login configs error', { error });
  }
}

// OAuth utilities for each provider

/**
 * Generate OAuth authorization URL
 */
export function generateOAuthUrl(provider: OAuthProvider, config: {
  appId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
}): string {
  const { appId, redirectUri, scope, state } = config;
  const encodedRedirect = encodeURIComponent(redirectUri);
  const stateParam = state || Math.random().toString(36).substring(7);

  switch (provider) {
    case 'WECHAT':
      return `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scope || 'snsapi_login'}&state=${stateParam}#wechat_redirect`;
    
    case 'DINGTALK':
      return `https://login.dingtalk.com/oauth2/auth?redirect_uri=${encodedRedirect}&response_type=code&client_id=${appId}&scope=${scope || 'openid'}&state=${stateParam}&prompt=consent`;
    
    case 'FEISHU':
      return `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${encodedRedirect}&state=${stateParam}`;
    
    case 'GOOGLE':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${appId}&redirect_uri=${encodedRedirect}&response_type=code&scope=${scope || 'email profile'}&state=${stateParam}`;
    
    case 'GITHUB':
      return `https://github.com/login/oauth/authorize?client_id=${appId}&redirect_uri=${encodedRedirect}&scope=${scope || 'user:email'}&state=${stateParam}`;
    
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

export default {
  OAUTH_PROVIDERS,
  getAllLoginConfigs,
  getLoginConfig,
  getEnabledLoginConfigs,
  upsertLoginConfig,
  toggleLoginConfig,
  deleteLoginConfig,
  initializeLoginConfigs,
  generateOAuthUrl,
};

