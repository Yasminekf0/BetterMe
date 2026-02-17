import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { StorageType } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import OSS from 'ali-oss';

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
 * 删除媒体文件
 */
export async function deleteMedia(id: string) {
  try {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new Error('Media not found / 媒体文件不存在');
    }

    // Delete file based on storage type / 根据存储类型删除文件
    if (media.storageType === 'LOCAL') {
      // Delete local file / 删除本地文件
      try {
        await fs.unlink(media.path);
      } catch (err) {
        logger.warn('Failed to delete local file / 删除本地文件失败', { path: media.path, error: err });
      }
    } else if (media.storageType === 'ALIYUN_OSS') {
      // Delete from Aliyun OSS / 从阿里云OSS删除
      try {
        const result = await deleteFromOSS(media.path);
        if (!result.success) {
          logger.warn('Failed to delete file from OSS / 从OSS删除文件失败', { 
            path: media.path, 
            error: result.error 
          });
        }
      } catch (err) {
        logger.warn('Failed to delete file from OSS / 从OSS删除文件失败', { path: media.path, error: err });
      }
    }
    // TODO: Implement AWS S3 deletion / 实现AWS S3删除
    // else if (media.storageType === 'AWS_S3') { ... }

    await prisma.media.delete({
      where: { id },
    });

    logger.info('Media deleted / 媒体文件已删除', { mediaId: id });
    return true;
  } catch (error) {
    logger.error('Delete media error / 删除媒体文件错误', { error, id });
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

// ==================== Aliyun OSS Integration 阿里云OSS集成 ====================

/**
 * Create Aliyun OSS client instance
 * 创建阿里云OSS客户端实例
 * @returns OSS client or null if not configured / OSS客户端或配置缺失时返回null
 */
export async function createOSSClient(skipEnabledCheck = false): Promise<OSS | null> {
  try {
    const config = await getStorageConfig('ALIYUN_OSS');
    
    // Skip enabled check for testing connection / 测试连接时跳过启用检查
    if (!skipEnabledCheck && (!config || !config.isEnabled)) {
      logger.warn('Aliyun OSS is not enabled / 阿里云OSS未启用');
      return null;
    }

    if (!config || !config.accessKeyId || !config.accessKeySecret || !config.bucket || !config.region) {
      logger.error('Aliyun OSS configuration incomplete / 阿里云OSS配置不完整');
      return null;
    }

    const ossClient = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      endpoint: config.endpoint || undefined,
      // Enable V4 signature for enhanced security / 启用V4签名提升安全性
      authorizationV4: true,
    });

    return ossClient;
  } catch (error) {
    logger.error('Failed to create OSS client / 创建OSS客户端失败', { error });
    return null;
  }
}

/**
 * Upload file to Aliyun OSS
 * 上传文件到阿里云OSS
 * @param localFilePath Local file path / 本地文件路径
 * @param ossKey OSS object key (file path in bucket) / OSS对象键（存储桶中的文件路径）
 * @param options Upload options / 上传选项
 * @returns Upload result with URL / 返回包含URL的上传结果
 */
export async function uploadToOSS(
  localFilePath: string,
  ossKey: string,
  options?: {
    contentType?: string;
    headers?: Record<string, string>;
  }
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    const config = await getStorageConfig('ALIYUN_OSS');
    
    // Build headers / 构建请求头
    const headers: Record<string, string> = {
      ...options?.headers,
    };
    if (options?.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    // Upload file to OSS / 上传文件到OSS
    const result = await client.put(ossKey, localFilePath, {
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    // Build file URL / 构建文件URL
    let fileUrl = result.url;
    if (config?.baseUrl) {
      // Use custom CDN domain if configured / 如果配置了CDN域名则使用
      fileUrl = `${config.baseUrl.replace(/\/$/, '')}/${ossKey}`;
    }

    logger.info('File uploaded to OSS successfully / 文件上传到OSS成功', {
      key: ossKey,
      url: fileUrl,
    });

    return {
      success: true,
      url: fileUrl,
      key: ossKey,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to upload file to OSS / 上传文件到OSS失败', {
      error,
      localFilePath,
      ossKey,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload buffer/stream to Aliyun OSS
 * 上传Buffer/流到阿里云OSS
 * @param content File buffer or readable stream / 文件Buffer或可读流
 * @param ossKey OSS object key / OSS对象键
 * @param options Upload options / 上传选项
 * @returns Upload result / 上传结果
 */
export async function uploadBufferToOSS(
  content: Buffer | NodeJS.ReadableStream,
  ossKey: string,
  options?: {
    contentType?: string;
    contentLength?: number;
  }
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    const config = await getStorageConfig('ALIYUN_OSS');

    // Build headers / 构建请求头
    const headers: Record<string, string> = {};
    if (options?.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    // Upload buffer/stream to OSS / 上传Buffer/流到OSS
    let resultName: string = ossKey;
    let resultUrl: string | undefined;
    
    if (Buffer.isBuffer(content)) {
      const putResult = await client.put(ossKey, content, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
      resultName = putResult.name;
      resultUrl = putResult.url;
    } else {
      // For stream upload, use putStream with proper options / 流式上传使用putStream
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const putStreamOptions: any = {};
      if (options?.contentType) {
        putStreamOptions.mime = options.contentType;
      }
      const streamResult = await client.putStream(ossKey, content as NodeJS.ReadableStream, putStreamOptions);
      resultName = streamResult.name ?? ossKey;
    }

    // Build file URL / 构建文件URL
    // Use bucket URL format: https://{bucket}.{region}.aliyuncs.com/{key}
    // 使用存储桶URL格式: https://{bucket}.{region}.aliyuncs.com/{key}
    let fileUrl = resultUrl || `https://${config?.bucket}.${config?.region}.aliyuncs.com/${ossKey}`;
    if (config?.baseUrl) {
      fileUrl = `${config.baseUrl.replace(/\/$/, '')}/${ossKey}`;
    }

    logger.info('Buffer uploaded to OSS successfully / Buffer上传到OSS成功', {
      key: resultName,
      url: fileUrl,
    });

    return {
      success: true,
      url: fileUrl,
      key: ossKey,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to upload buffer to OSS / 上传Buffer到OSS失败', {
      error,
      ossKey,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete file from Aliyun OSS
 * 从阿里云OSS删除文件
 * @param ossKey OSS object key to delete / 要删除的OSS对象键
 * @returns Deletion result / 删除结果
 */
export async function deleteFromOSS(
  ossKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    await client.delete(ossKey);

    logger.info('File deleted from OSS successfully / 文件从OSS删除成功', { key: ossKey });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete file from OSS / 从OSS删除文件失败', {
      error,
      ossKey,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch delete files from Aliyun OSS
 * 批量从阿里云OSS删除文件
 * @param ossKeys Array of OSS object keys to delete / 要删除的OSS对象键数组
 * @returns Deletion result / 删除结果
 */
export async function batchDeleteFromOSS(
  ossKeys: string[]
): Promise<{ success: boolean; deleted?: string[]; failed?: string[]; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    if (ossKeys.length === 0) {
      return { success: true, deleted: [], failed: [] };
    }

    const result = await client.deleteMulti(ossKeys, { quiet: false });

    logger.info('Batch delete from OSS completed / 批量删除OSS文件完成', {
      count: ossKeys.length,
      deleted: result.deleted?.length || 0,
    });

    // Extract deleted keys from result / 从结果中提取已删除的键
    const deletedKeys: string[] = [];
    if (result.deleted && Array.isArray(result.deleted)) {
      for (const item of result.deleted) {
        if (typeof item === 'string') {
          deletedKeys.push(item);
        } else if (item && typeof item === 'object' && 'Key' in item) {
          deletedKeys.push((item as { Key: string }).Key);
        }
      }
    }
    
    return {
      success: true,
      deleted: deletedKeys,
      failed: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to batch delete from OSS / 批量删除OSS文件失败', {
      error,
      count: ossKeys.length,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get signed URL for private OSS object
 * 获取私有OSS对象的签名URL
 * @param ossKey OSS object key / OSS对象键
 * @param expires URL expiration time in seconds (default: 3600) / URL过期时间秒数（默认3600）
 * @returns Signed URL / 签名URL
 */
export async function getOSSSignedUrl(
  ossKey: string,
  expires: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    // signatureUrl is synchronous method / signatureUrl是同步方法
    const url = client.signatureUrl(ossKey, {
      expires,
    });

    return { success: true, url };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to generate OSS signed URL / 生成OSS签名URL失败', {
      error,
      ossKey,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if OSS object exists
 * 检查OSS对象是否存在
 * @param ossKey OSS object key / OSS对象键
 * @returns Existence check result / 存在性检查结果
 */
export async function checkOSSObjectExists(
  ossKey: string
): Promise<{ success: boolean; exists?: boolean; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    try {
      await client.head(ossKey);
      return { success: true, exists: true };
    } catch (headError: unknown) {
      // Check if it's a NoSuchKey error (object not found) / 检查是否为NoSuchKey错误（对象不存在）
      if (headError && typeof headError === 'object' && 'code' in headError && headError.code === 'NoSuchKey') {
        return { success: true, exists: false };
      }
      throw headError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to check OSS object existence / 检查OSS对象存在性失败', {
      error,
      ossKey,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Test Aliyun OSS connection
 * 测试阿里云OSS连接
 * @returns Connection test result / 连接测试结果
 */
export async function testOSSConnection(): Promise<{
  success: boolean;
  message: string;
  bucketInfo?: Record<string, unknown>;
}> {
  try {
    // Skip enabled check for testing / 测试时跳过启用检查
    const client = await createOSSClient(true);
    if (!client) {
      return {
        success: false,
        message: 'OSS client not available. Please check configuration (Access Key ID, Access Key Secret, Region, Bucket are required). / OSS客户端不可用，请检查配置（Access Key ID、Access Key Secret、Region、Bucket为必填项）。',
      };
    }

    // Get bucket info to verify connection / 获取存储桶信息以验证连接
    const config = await getStorageConfig('ALIYUN_OSS');
    const bucketName = config?.bucket || '';
    const bucketInfo = await client.getBucketInfo(bucketName);

    logger.info('OSS connection test successful / OSS连接测试成功');

    return {
      success: true,
      message: 'Connection successful / 连接成功',
      bucketInfo: {
        name: bucketInfo.bucket?.Name || bucketName,
        location: bucketInfo.bucket?.Location,
        creationDate: bucketInfo.bucket?.CreationDate,
        storageClass: bucketInfo.bucket?.StorageClass,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('OSS connection test failed / OSS连接测试失败', { error });

    return {
      success: false,
      message: `Connection failed: ${errorMessage} / 连接失败: ${errorMessage}`,
    };
  }
}

/**
 * List OSS objects with prefix
 * 列出指定前缀的OSS对象
 * @param prefix Object key prefix / 对象键前缀
 * @param options List options / 列表选项
 * @returns List result / 列表结果
 */
export async function listOSSObjects(
  prefix?: string,
  options?: {
    maxKeys?: number;
    marker?: string;
  }
): Promise<{
  success: boolean;
  objects?: Array<{ name: string; size: number; lastModified: string }>;
  nextMarker?: string;
  isTruncated?: boolean;
  error?: string;
}> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    const result = await client.list(
      {
        prefix: prefix || '',
        'max-keys': options?.maxKeys || 100,
        marker: options?.marker || '',
      },
      {}
    );

    return {
      success: true,
      objects: (result.objects || []).map((obj) => ({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
      })),
      nextMarker: result.nextMarker,
      isTruncated: result.isTruncated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to list OSS objects / 列出OSS对象失败', {
      error,
      prefix,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Copy OSS object
 * 复制OSS对象
 * @param sourceKey Source object key / 源对象键
 * @param targetKey Target object key / 目标对象键
 * @returns Copy result / 复制结果
 */
export async function copyOSSObject(
  sourceKey: string,
  targetKey: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const client = await createOSSClient();
    if (!client) {
      return { success: false, error: 'OSS client not available / OSS客户端不可用' };
    }

    const config = await getStorageConfig('ALIYUN_OSS');
    await client.copy(targetKey, sourceKey);

    // Build file URL / 构建文件URL
    // Use bucket URL format or custom baseUrl / 使用存储桶URL格式或自定义baseUrl
    let fileUrl = `https://${config?.bucket}.${config?.region}.aliyuncs.com/${targetKey}`;
    if (config?.baseUrl) {
      fileUrl = `${config.baseUrl.replace(/\/$/, '')}/${targetKey}`;
    }

    logger.info('OSS object copied successfully / OSS对象复制成功', {
      sourceKey,
      targetKey,
    });

    return { success: true, url: fileUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to copy OSS object / 复制OSS对象失败', {
      error,
      sourceKey,
      targetKey,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate OSS object key with organized directory structure
 * 生成带有组织化目录结构的OSS对象键
 * @param originalName Original file name / 原始文件名
 * @param directory Optional custom directory / 可选的自定义目录
 * @returns Generated OSS key / 生成的OSS键
 */
export function generateOSSKey(originalName: string, directory?: string): string {
  const fileName = generateFileName(originalName);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Build path: media/{year}/{month}/{day}/{filename} or {directory}/{year}/{month}/{day}/{filename}
  // 构建路径: media/{年}/{月}/{日}/{文件名} 或 {目录}/{年}/{月}/{日}/{文件名}
  const basePath = directory || 'media';
  return `${basePath}/${year}/${month}/${day}/${fileName}`;
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
  // Aliyun OSS functions / 阿里云OSS功能
  createOSSClient,
  uploadToOSS,
  uploadBufferToOSS,
  deleteFromOSS,
  batchDeleteFromOSS,
  getOSSSignedUrl,
  checkOSSObjectExists,
  testOSSConnection,
  listOSSObjects,
  copyOSSObject,
  generateOSSKey,
};

