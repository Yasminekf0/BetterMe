import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { StorageType } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Media Service
 * Manages media file uploads and storage
 */

// Default allowed mime types
const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

// Default max file size (10MB)
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get all media files with pagination
 */
export async function getAllMedia(options: {
  page?: number;
  pageSize?: number;
  mimeType?: string;
  uploadedById?: string;
  search?: string;
}) {
  try {
    const { page = 1, pageSize = 20, mimeType, uploadedById, search } = options;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (mimeType) {
      where.mimeType = { startsWith: mimeType };
    }
    if (uploadedById) {
      where.uploadedById = uploadedById;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.media.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Get all media error', { error });
    throw error;
  }
}

/**
 * Get media by ID
 */
export async function getMediaById(id: string) {
  try {
    return await prisma.media.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  } catch (error) {
    logger.error('Get media by ID error', { error, id });
    throw error;
  }
}

/**
 * Create media record
 */
export async function createMedia(data: {
  name: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  storageType: StorageType;
  bucket?: string;
  uploadedById: string;
}) {
  try {
    const media = await prisma.media.create({
      data,
    });
    logger.info('Media created', { mediaId: media.id, name: media.name });
    return media;
  } catch (error) {
    logger.error('Create media error', { error });
    throw error;
  }
}

/**
 * Delete media
 */
export async function deleteMedia(id: string) {
  try {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Delete file based on storage type
    if (media.storageType === 'LOCAL') {
      try {
        await fs.unlink(media.path);
      } catch (err) {
        logger.warn('Failed to delete local file', { path: media.path, error: err });
      }
    }
    // For cloud storage, implement deletion via respective SDKs

    await prisma.media.delete({
      where: { id },
    });

    logger.info('Media deleted', { mediaId: id });
    return true;
  } catch (error) {
    logger.error('Delete media error', { error, id });
    throw error;
  }
}

/**
 * Batch delete media
 */
export async function batchDeleteMedia(ids: string[]) {
  try {
    const results = await Promise.allSettled(
      ids.map(id => deleteMedia(id))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Batch delete media completed', { succeeded, failed });
    return { succeeded, failed };
  } catch (error) {
    logger.error('Batch delete media error', { error });
    throw error;
  }
}

/**
 * Generate unique filename
 */
export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  try {
    const stats = await prisma.media.groupBy({
      by: ['storageType'],
      _count: { id: true },
      _sum: { size: true },
    });

    const totalCount = await prisma.media.count();
    const totalSize = await prisma.media.aggregate({
      _sum: { size: true },
    });

    return {
      total: {
        count: totalCount,
        size: totalSize._sum.size || 0,
      },
      byStorage: stats.map(s => ({
        storageType: s.storageType,
        count: s._count.id,
        size: s._sum.size || 0,
      })),
    };
  } catch (error) {
    logger.error('Get storage stats error', { error });
    throw error;
  }
}

// ==================== Storage Config ====================

/**
 * Get all storage configurations
 */
export async function getAllStorageConfigs() {
  try {
    const configs = await prisma.storageConfig.findMany({
      orderBy: { type: 'asc' },
    });
    return configs;
  } catch (error) {
    logger.error('Get all storage configs error', { error });
    return [];
  }
}

/**
 * Get storage configuration by type
 */
export async function getStorageConfig(type: StorageType) {
  try {
    return await prisma.storageConfig.findUnique({
      where: { type },
    });
  } catch (error) {
    logger.error('Get storage config error', { error, type });
    return null;
  }
}

/**
 * Get default storage configuration
 */
export async function getDefaultStorageConfig() {
  try {
    return await prisma.storageConfig.findFirst({
      where: { isDefault: true, isEnabled: true },
    });
  } catch (error) {
    logger.error('Get default storage config error', { error });
    return null;
  }
}

/**
 * Create or update storage configuration
 */
export async function upsertStorageConfig(data: {
  type: StorageType;
  name: string;
  isEnabled?: boolean;
  isDefault?: boolean;
  accessKeyId?: string;
  accessKeySecret?: string;
  endpoint?: string;
  bucket?: string;
  region?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsBucket?: string;
  baseUrl?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}) {
  try {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.storageConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const config = await prisma.storageConfig.upsert({
      where: { type: data.type },
      update: {
        name: data.name,
        isEnabled: data.isEnabled,
        isDefault: data.isDefault,
        accessKeyId: data.accessKeyId,
        accessKeySecret: data.accessKeySecret,
        endpoint: data.endpoint,
        bucket: data.bucket,
        region: data.region,
        awsAccessKeyId: data.awsAccessKeyId,
        awsSecretAccessKey: data.awsSecretAccessKey,
        awsRegion: data.awsRegion,
        awsBucket: data.awsBucket,
        baseUrl: data.baseUrl,
        maxFileSize: data.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
        allowedMimeTypes: data.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES,
      },
      create: {
        type: data.type,
        name: data.name,
        isEnabled: data.isEnabled ?? false,
        isDefault: data.isDefault ?? false,
        accessKeyId: data.accessKeyId,
        accessKeySecret: data.accessKeySecret,
        endpoint: data.endpoint,
        bucket: data.bucket,
        region: data.region,
        awsAccessKeyId: data.awsAccessKeyId,
        awsSecretAccessKey: data.awsSecretAccessKey,
        awsRegion: data.awsRegion,
        awsBucket: data.awsBucket,
        baseUrl: data.baseUrl,
        maxFileSize: data.maxFileSize ?? DEFAULT_MAX_FILE_SIZE,
        allowedMimeTypes: data.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES,
      },
    });

    logger.info('Storage config upserted', { type: data.type });
    return config;
  } catch (error) {
    logger.error('Upsert storage config error', { error, type: data.type });
    throw error;
  }
}

/**
 * Toggle storage configuration status
 */
export async function toggleStorageConfig(type: StorageType) {
  try {
    const config = await prisma.storageConfig.findUnique({
      where: { type },
    });

    if (!config) {
      throw new Error('Storage config not found');
    }

    const updated = await prisma.storageConfig.update({
      where: { type },
      data: { isEnabled: !config.isEnabled },
    });

    logger.info('Storage config toggled', { type, isEnabled: updated.isEnabled });
    return updated;
  } catch (error) {
    logger.error('Toggle storage config error', { error, type });
    throw error;
  }
}

/**
 * Initialize default storage configurations
 */
export async function initializeStorageConfigs() {
  try {
    const defaults = [
      { type: 'LOCAL' as StorageType, name: 'Local Storage', isDefault: true, isEnabled: true },
      { type: 'ALIYUN_OSS' as StorageType, name: 'Aliyun OSS', isDefault: false, isEnabled: false },
      { type: 'AWS_S3' as StorageType, name: 'AWS S3', isDefault: false, isEnabled: false },
    ];

    for (const config of defaults) {
      const existing = await prisma.storageConfig.findUnique({
        where: { type: config.type },
      });

      if (!existing) {
        await prisma.storageConfig.create({
          data: {
            ...config,
            maxFileSize: DEFAULT_MAX_FILE_SIZE,
            allowedMimeTypes: DEFAULT_ALLOWED_MIME_TYPES,
          },
        });
      }
    }

    logger.info('Storage configs initialized');
  } catch (error) {
    logger.error('Initialize storage configs error', { error });
  }
}

export default {
  getAllMedia,
  getMediaById,
  createMedia,
  deleteMedia,
  batchDeleteMedia,
  generateFileName,
  getStorageStats,
  getAllStorageConfigs,
  getStorageConfig,
  getDefaultStorageConfig,
  upsertStorageConfig,
  toggleStorageConfig,
  initializeStorageConfigs,
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE,
};

