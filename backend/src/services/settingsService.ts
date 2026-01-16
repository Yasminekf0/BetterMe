import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Settings Service
 * Manages system configuration stored in database
 */

// Default system settings
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  // System Info
  'system.name': 'Master Trainer',
  'system.description': 'AI-Powered Sales Training System',
  'system.logo': null,
  
  // Login/Auth Settings
  'auth.sessionTimeout': 30, // minutes
  'auth.loginMethods': ['email'], // email, dingtalk
  'auth.allowRegistration': true,
  
  // AI Settings
  'ai.maxDialogueTurns': 8,
  'ai.temperature': 0.7,
  'ai.maxTokens': 2000,
  'ai.timeout': 30, // seconds
  'ai.defaultModel': 'gpt-4o-mini',
  
  // Roleplay Settings
  'roleplay.minMessageLength': 10,
  'roleplay.maxMessageLength': 2000,
  
  // Notification Settings
  'notification.newUserRegistration': true,
  'notification.scenarioUpdate': true,
  'notification.systemError': true,
  'notification.weeklyReport': true,
  
  // Scoring Weights
  'scoring.valueArticulation': 35,
  'scoring.objectionHandling': 35,
  'scoring.technicalClarity': 30,
};

/**
 * Get a single setting value by key
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (setting) {
      return setting.value as T;
    }

    // Return default value if exists
    if (key in DEFAULT_SETTINGS) {
      return DEFAULT_SETTINGS[key] as T;
    }

    return null;
  } catch (error) {
    logger.error('Get setting error', { error, key });
    return null;
  }
}

/**
 * Set a single setting value
 */
export async function setSetting(key: string, value: unknown): Promise<boolean> {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });
    
    logger.info('Setting updated', { key });
    return true;
  } catch (error) {
    logger.error('Set setting error', { error, key });
    return false;
  }
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<string, unknown>> {
  try {
    const dbSettings = await prisma.systemSetting.findMany();
    
    // Merge with defaults
    const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    
    dbSettings.forEach((setting) => {
      settings[setting.key] = setting.value;
    });

    return settings;
  } catch (error) {
    logger.error('Get all settings error', { error });
    return DEFAULT_SETTINGS;
  }
}

/**
 * Get settings by category (prefix)
 */
export async function getSettingsByCategory(category: string): Promise<Record<string, unknown>> {
  try {
    const allSettings = await getAllSettings();
    const prefix = `${category}.`;
    
    const categorySettings: Record<string, unknown> = {};
    
    Object.entries(allSettings).forEach(([key, value]) => {
      if (key.startsWith(prefix)) {
        // Remove prefix from key
        const shortKey = key.substring(prefix.length);
        categorySettings[shortKey] = value;
      }
    });

    return categorySettings;
  } catch (error) {
    logger.error('Get settings by category error', { error, category });
    return {};
  }
}

/**
 * Bulk update settings
 */
export async function bulkUpdateSettings(
  settings: Record<string, unknown>
): Promise<{ success: boolean; updated: number }> {
  try {
    let updated = 0;

    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object },
      });
      updated++;
    }

    logger.info('Bulk settings updated', { count: updated });
    return { success: true, updated };
  } catch (error) {
    logger.error('Bulk update settings error', { error });
    return { success: false, updated: 0 };
  }
}

/**
 * Delete a setting (revert to default)
 */
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await prisma.systemSetting.delete({
      where: { key },
    });
    
    logger.info('Setting deleted', { key });
    return true;
  } catch (error) {
    // Ignore if not found
    logger.warn('Delete setting - not found', { key });
    return false;
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetToDefaults(): Promise<boolean> {
  try {
    await prisma.systemSetting.deleteMany();
    logger.info('All settings reset to defaults');
    return true;
  } catch (error) {
    logger.error('Reset settings error', { error });
    return false;
  }
}

/**
 * Initialize settings with defaults if not present
 */
export async function initializeSettings(): Promise<void> {
  try {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!existing) {
        await prisma.systemSetting.create({
          data: { key, value: value as object },
        });
      }
    }
    
    logger.info('Settings initialized');
  } catch (error) {
    logger.error('Initialize settings error', { error });
  }
}

export default {
  getSetting,
  setSetting,
  getAllSettings,
  getSettingsByCategory,
  bulkUpdateSettings,
  deleteSetting,
  resetToDefaults,
  initializeSettings,
  DEFAULT_SETTINGS,
};

