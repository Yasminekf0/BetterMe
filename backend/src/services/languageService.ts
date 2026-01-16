import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Language Service
 * Manages multi-language settings and translations
 */

// Default supported languages
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', isDefault: true },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: false },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', isDefault: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isDefault: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', isDefault: false },
];

// ==================== Languages ====================

export async function getAllLanguages(options?: { includeDisabled?: boolean }) {
  try {
    const where: Record<string, unknown> = {};
    if (!options?.includeDisabled) where.isEnabled = true;

    return await prisma.language.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    });
  } catch (error) {
    logger.error('Get all languages error', { error });
    throw error;
  }
}

export async function getLanguage(idOrCode: string) {
  try {
    return await prisma.language.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
    });
  } catch (error) {
    logger.error('Get language error', { error, idOrCode });
    throw error;
  }
}

export async function getDefaultLanguage() {
  try {
    return await prisma.language.findFirst({
      where: { isDefault: true, isEnabled: true },
    });
  } catch (error) {
    logger.error('Get default language error', { error });
    throw error;
  }
}

export async function createLanguage(data: {
  code: string;
  name: string;
  nativeName: string;
  isEnabled?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}) {
  try {
    const existing = await prisma.language.findUnique({ where: { code: data.code } });
    if (existing) throw new Error('Language code already exists');

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const language = await prisma.language.create({
      data: {
        code: data.code,
        name: data.name,
        nativeName: data.nativeName,
        isEnabled: data.isEnabled ?? true,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    logger.info('Language created', { languageId: language.id, code: language.code });
    return language;
  } catch (error) {
    logger.error('Create language error', { error });
    throw error;
  }
}

export async function updateLanguage(id: string, data: Partial<{
  name: string;
  nativeName: string;
  isEnabled: boolean;
  isDefault: boolean;
  sortOrder: number;
}>) {
  try {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const language = await prisma.language.update({ where: { id }, data });
    logger.info('Language updated', { languageId: id });
    return language;
  } catch (error) {
    logger.error('Update language error', { error, id });
    throw error;
  }
}

export async function setDefaultLanguage(id: string) {
  try {
    // Unset current default
    await prisma.language.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set new default
    const language = await prisma.language.update({
      where: { id },
      data: { isDefault: true, isEnabled: true },
    });

    logger.info('Default language set', { languageId: id, code: language.code });
    return language;
  } catch (error) {
    logger.error('Set default language error', { error, id });
    throw error;
  }
}

export async function deleteLanguage(id: string) {
  try {
    const language = await prisma.language.findUnique({ where: { id } });
    if (!language) throw new Error('Language not found');
    if (language.isDefault) throw new Error('Cannot delete default language');

    // Delete all translations for this language
    await prisma.translation.deleteMany({ where: { languageId: id } });

    await prisma.language.delete({ where: { id } });
    logger.info('Language deleted', { languageId: id });
    return true;
  } catch (error) {
    logger.error('Delete language error', { error, id });
    throw error;
  }
}

export async function initializeLanguages() {
  try {
    for (let i = 0; i < DEFAULT_LANGUAGES.length; i++) {
      const lang = DEFAULT_LANGUAGES[i];
      const existing = await prisma.language.findUnique({
        where: { code: lang.code },
      });

      if (!existing) {
        await prisma.language.create({
          data: {
            ...lang,
            isEnabled: true,
            sortOrder: i,
          },
        });
      }
    }
    logger.info('Languages initialized');
  } catch (error) {
    logger.error('Initialize languages error', { error });
  }
}

// ==================== Translations ====================

export async function getTranslations(languageCode: string, namespace?: string) {
  try {
    const language = await prisma.language.findUnique({
      where: { code: languageCode },
    });

    if (!language) throw new Error('Language not found');

    const where: Record<string, unknown> = { languageId: language.id };
    if (namespace) where.namespace = namespace;

    const translations = await prisma.translation.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object
    const result: Record<string, string> = {};
    for (const t of translations) {
      result[t.key] = t.value;
    }

    return result;
  } catch (error) {
    logger.error('Get translations error', { error, languageCode, namespace });
    throw error;
  }
}

export async function getAllTranslationsAdmin(options: {
  page?: number;
  pageSize?: number;
  languageId?: string;
  namespace?: string;
  search?: string;
}) {
  try {
    const { page = 1, pageSize = 50, languageId, namespace, search } = options;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (languageId) where.languageId = languageId;
    if (namespace) where.namespace = namespace;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { value: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.translation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
        include: {
          language: { select: { code: true, name: true } },
        },
      }),
      prisma.translation.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    logger.error('Get all translations admin error', { error });
    throw error;
  }
}

export async function upsertTranslation(data: {
  languageId: string;
  key: string;
  value: string;
  namespace?: string;
}) {
  try {
    const translation = await prisma.translation.upsert({
      where: {
        languageId_key_namespace: {
          languageId: data.languageId,
          key: data.key,
          namespace: data.namespace ?? 'common',
        },
      },
      update: { value: data.value },
      create: {
        languageId: data.languageId,
        key: data.key,
        value: data.value,
        namespace: data.namespace ?? 'common',
      },
    });

    logger.info('Translation upserted', { key: data.key, languageId: data.languageId });
    return translation;
  } catch (error) {
    logger.error('Upsert translation error', { error, key: data.key });
    throw error;
  }
}

export async function bulkUpsertTranslations(languageId: string, translations: Record<string, string>, namespace?: string) {
  try {
    let count = 0;
    for (const [key, value] of Object.entries(translations)) {
      await prisma.translation.upsert({
        where: {
          languageId_key_namespace: {
            languageId,
            key,
            namespace: namespace ?? 'common',
          },
        },
        update: { value },
        create: { languageId, key, value, namespace: namespace ?? 'common' },
      });
      count++;
    }

    logger.info('Bulk translations upserted', { languageId, count, namespace });
    return { count };
  } catch (error) {
    logger.error('Bulk upsert translations error', { error, languageId });
    throw error;
  }
}

export async function deleteTranslation(id: string) {
  try {
    await prisma.translation.delete({ where: { id } });
    logger.info('Translation deleted', { translationId: id });
    return true;
  } catch (error) {
    logger.error('Delete translation error', { error, id });
    throw error;
  }
}

export async function getNamespaces() {
  try {
    const namespaces = await prisma.translation.groupBy({
      by: ['namespace'],
      _count: { id: true },
    });

    return namespaces.map(n => ({
      namespace: n.namespace,
      count: n._count.id,
    }));
  } catch (error) {
    logger.error('Get namespaces error', { error });
    throw error;
  }
}

export async function getLanguageStats() {
  try {
    const [languagesCount, enabledCount, translationsCount] = await Promise.all([
      prisma.language.count(),
      prisma.language.count({ where: { isEnabled: true } }),
      prisma.translation.count(),
    ]);

    const translationsByLanguage = await prisma.translation.groupBy({
      by: ['languageId'],
      _count: { id: true },
    });

    const languages = await prisma.language.findMany({
      select: { id: true, code: true, name: true },
    });

    const byLanguage = translationsByLanguage.map(t => {
      const lang = languages.find(l => l.id === t.languageId);
      return {
        languageId: t.languageId,
        code: lang?.code || 'unknown',
        name: lang?.name || 'Unknown',
        count: t._count.id,
      };
    });

    return { languagesCount, enabledCount, translationsCount, byLanguage };
  } catch (error) {
    logger.error('Get language stats error', { error });
    throw error;
  }
}

export default {
  getAllLanguages,
  getLanguage,
  getDefaultLanguage,
  createLanguage,
  updateLanguage,
  setDefaultLanguage,
  deleteLanguage,
  initializeLanguages,
  getTranslations,
  getAllTranslationsAdmin,
  upsertTranslation,
  bulkUpsertTranslations,
  deleteTranslation,
  getNamespaces,
  getLanguageStats,
};

