/**
 * RAG Controller - Document Upload and Management
 * RAG控制器 - 文档上传和管理
 * 
 * Handles RAG document operations for admin panel
 * 处理管理员面板的RAG文档操作
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { ragService, ChunkOptions } from '../services/ragService';
import operationLogService, { OperationType, TargetType } from '../services/operationLogService';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ==================== Configuration / 配置 ====================

// Supported file types / 支持的文件类型
const SUPPORTED_FILE_TYPES = [
  '.txt', '.csv',           // Text files / 文本文件
  '.pdf',                   // PDF files / PDF文件
  '.doc', '.docx',          // Word documents / Word文档
  '.ppt', '.pptx',          // PowerPoint files / PowerPoint文件
  '.xls', '.xlsx',          // Excel files / Excel文件
];

// Maximum file size (default 50MB) / 最大文件大小（默认50MB）
const MAX_FILE_SIZE = parseInt(process.env.RAG_MAX_FILE_SIZE || '52428800', 10);

// Upload directory / 上传目录
const UPLOAD_DIR = process.env.RAG_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'rag');

// ==================== Helper Functions / 辅助函数 ====================

/**
 * Ensure upload directory exists
 * 确保上传目录存在
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info(`Created RAG upload directory / 创建RAG上传目录: ${UPLOAD_DIR}`);
  }
}

/**
 * Validate file type
 * 验证文件类型
 */
function isValidFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_FILE_TYPES.includes(ext);
}

/**
 * Get MIME type from extension
 * 从扩展名获取MIME类型
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// ==================== Controller Functions / 控制器函数 ====================

/**
 * Upload RAG Document
 * 上传RAG文档
 * POST /api/admin/rag/upload
 * 
 * Request body (multipart/form-data):
 * - file: The document file / 文档文件
 * - name: Optional display name / 可选显示名称
 * - description: Optional description / 可选描述
 * - chunkSize: Optional chunk size (default 500) / 可选块大小（默认500）
 * - chunkOverlap: Optional chunk overlap (default 50) / 可选块重叠（默认50）
 * - autoProcess: Whether to process immediately (default true) / 是否立即处理（默认true）
 */
export async function uploadRAGDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    // Check if file exists / 检查文件是否存在
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded / 未上传文件',
      });
      return;
    }

    const file = req.file;
    const {
      name,
      description,
      chunkSize = '500',
      chunkOverlap = '50',
      autoProcess = 'true',
    } = req.body;

    // Validate file type / 验证文件类型
    if (!isValidFileType(file.originalname)) {
      res.status(400).json({
        success: false,
        error: `Unsupported file type. Supported types / 不支持的文件类型。支持的类型: ${SUPPORTED_FILE_TYPES.join(', ')}`,
      });
      return;
    }

    // Validate file size / 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      res.status(400).json({
        success: false,
        error: `File too large. Maximum size / 文件过大。最大大小: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return;
    }

    // Ensure upload directory exists / 确保上传目录存在
    await ensureUploadDir();

    // Generate unique filename / 生成唯一文件名
    const fileExt = path.extname(file.originalname).toLowerCase();
    const documentId = uuidv4();
    const savedFileName = `${documentId}${fileExt}`;
    const filePath = path.join(UPLOAD_DIR, savedFileName);

    // Save file to disk / 将文件保存到磁盘
    await fs.writeFile(filePath, file.buffer);

    // Create database record / 创建数据库记录
    const document = await prisma.rAGDocument.create({
      data: {
        id: documentId,
        name: name || file.originalname,
        originalName: file.originalname,
        fileType: fileExt,
        filePath: filePath,
        fileSize: file.size,
        mimeType: getMimeType(fileExt),
        status: 'PENDING',
        chunkSize: parseInt(chunkSize, 10) || 500,
        chunkOverlap: parseInt(chunkOverlap, 10) || 50,
        description: description || null,
        uploadedById: req.user!.id,
      },
    });

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.SETTING, // Using SETTING as a general type / 使用SETTING作为通用类型
      targetId: document.id,
      description: `Uploaded RAG document / 上传RAG文档: ${file.originalname}`,
      details: { fileType: fileExt, fileSize: file.size },
      req,
    });

    logger.info('RAG document uploaded / RAG文档已上传', {
      documentId: document.id,
      fileName: file.originalname,
      fileSize: file.size,
      uploadedBy: req.user!.id,
    });

    // Auto process if enabled / 如果启用则自动处理
    if (autoProcess === 'true') {
      // Process asynchronously / 异步处理
      processDocumentAsync(document.id, filePath, file.originalname, {
        chunkSize: parseInt(chunkSize, 10) || 500,
        chunkOverlap: parseInt(chunkOverlap, 10) || 50,
      });
    }

    res.status(201).json({
      success: true,
      message: autoProcess === 'true' 
        ? 'Document uploaded and processing started / 文档已上传，开始处理' 
        : 'Document uploaded successfully / 文档上传成功',
      data: {
        id: document.id,
        name: document.name,
        originalName: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        status: document.status,
        chunkSize: document.chunkSize,
        chunkOverlap: document.chunkOverlap,
        createdAt: document.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Upload RAG document error / 上传RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to upload document / 上传文档失败',
    });
  }
}

/**
 * Process document asynchronously
 * 异步处理文档
 */
async function processDocumentAsync(
  documentId: string,
  filePath: string,
  fileName: string,
  options: ChunkOptions
): Promise<void> {
  try {
    // Update status to processing / 更新状态为处理中
    await prisma.rAGDocument.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // Process document / 处理文档
    const result = await ragService.processDocument(filePath, fileName, documentId, options);

    // Update database with results / 用结果更新数据库
    await prisma.rAGDocument.update({
      where: { id: documentId },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        chunkCount: result.insertedCount + result.failedCount,
        vectorCount: result.insertedCount,
        errorMessage: result.errors?.join('; ') || null,
        processedAt: new Date(),
      },
    });

    logger.info('RAG document processing completed / RAG文档处理完成', {
      documentId,
      success: result.success,
      insertedCount: result.insertedCount,
      failedCount: result.failedCount,
    });
  } catch (error: any) {
    logger.error('RAG document processing failed / RAG文档处理失败', {
      documentId,
      error: error.message,
    });

    // Update status to failed / 更新状态为失败
    await prisma.rAGDocument.update({
      where: { id: documentId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        processedAt: new Date(),
      },
    });
  }
}

/**
 * Get All RAG Documents
 * 获取所有RAG文档
 * GET /api/admin/rag/documents
 */
export async function getRAGDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      pageSize = '20',
      status,
      fileType,
      search,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    // Build where clause / 构建查询条件
    const where: Record<string, any> = {};
    if (status) {
      where.status = status;
    }
    if (fileType) {
      where.fileType = fileType;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { originalName: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.rAGDocument.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          status: true,
          chunkCount: true,
          chunkSize: true,
          chunkOverlap: true,
          vectorCount: true,
          errorMessage: true,
          description: true,
          tags: true,
          processedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.rAGDocument.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: documents,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error: any) {
    logger.error('Get RAG documents error / 获取RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get documents / 获取文档失败',
    });
  }
}

/**
 * Get RAG Document by ID with optional chunks
 * 根据ID获取RAG文档（可选包含块）
 * GET /api/admin/rag/documents/:id
 */
export async function getRAGDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { includeChunks = 'false' } = req.query;

    const document = await prisma.rAGDocument.findUnique({
      where: { id },
      include: includeChunks === 'true' ? {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          select: {
            id: true,
            chunkIndex: true,
            text: true,
            startOffset: true,
            endOffset: true,
            createdAt: true,
          },
        },
      } : undefined,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found / 文档未找到',
      });
      return;
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    logger.error('Get RAG document error / 获取RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get document / 获取文档失败',
    });
  }
}

/**
 * Get RAG Document Chunks
 * 获取RAG文档的所有块
 * GET /api/admin/rag/documents/:id/chunks
 */
export async function getRAGDocumentChunks(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    // Check if document exists / 检查文档是否存在
    const document = await prisma.rAGDocument.findUnique({
      where: { id },
      select: { id: true, name: true, chunkCount: true },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found / 文档未找到',
      });
      return;
    }

    // Get chunks with pagination / 分页获取块
    const [chunks, total] = await Promise.all([
      prisma.rAGChunk.findMany({
        where: { documentId: id },
        orderBy: { chunkIndex: 'asc' },
        skip,
        take: pageSizeNum,
        select: {
          id: true,
          chunkIndex: true,
          text: true,
          startOffset: true,
          endOffset: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.rAGChunk.count({ where: { documentId: id } }),
    ]);

    // Check if chunks have embeddings / 检查块是否有嵌入向量
    const chunksWithEmbeddingFlag = await Promise.all(
      chunks.map(async (chunk) => {
        const fullChunk = await prisma.rAGChunk.findUnique({
          where: { id: chunk.id },
          select: { embedding: true },
        });
        return {
          ...chunk,
          hasEmbedding: fullChunk?.embedding !== null,
        };
      })
    );

    res.json({
      success: true,
      data: {
        document: {
          id: document.id,
          name: document.name,
          chunkCount: document.chunkCount,
        },
        chunks: chunksWithEmbeddingFlag,
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      },
    });
  } catch (error: any) {
    logger.error('Get RAG document chunks error / 获取RAG文档块错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get document chunks / 获取文档块失败',
    });
  }
}

/**
 * Reprocess RAG Document
 * 重新处理RAG文档
 * POST /api/admin/rag/documents/:id/reprocess
 */
export async function reprocessRAGDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { chunkSize, chunkOverlap } = req.body;

    const document = await prisma.rAGDocument.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found / 文档未找到',
      });
      return;
    }

    // Update chunk settings if provided / 如果提供则更新切块设置
    const updateData: Record<string, any> = {
      status: 'PENDING',
      errorMessage: null,
    };
    if (chunkSize !== undefined) {
      updateData.chunkSize = parseInt(chunkSize, 10);
    }
    if (chunkOverlap !== undefined) {
      updateData.chunkOverlap = parseInt(chunkOverlap, 10);
    }

    await prisma.rAGDocument.update({
      where: { id },
      data: updateData,
    });

    // Delete existing vectors / 删除现有向量
    try {
      await ragService.deleteDocumentVectors(id);
    } catch (error: any) {
      logger.warn('Failed to delete existing vectors / 删除现有向量失败', { error: error.message });
    }

    // Start reprocessing / 开始重新处理
    processDocumentAsync(
      document.id,
      document.filePath,
      document.originalName,
      {
        chunkSize: updateData.chunkSize || document.chunkSize,
        chunkOverlap: updateData.chunkOverlap || document.chunkOverlap,
      }
    );

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      targetId: document.id,
      description: `Reprocessing RAG document / 重新处理RAG文档: ${document.name}`,
      req,
    });

    res.json({
      success: true,
      message: 'Document reprocessing started / 文档重新处理已开始',
    });
  } catch (error: any) {
    logger.error('Reprocess RAG document error / 重新处理RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reprocess document / 重新处理文档失败',
    });
  }
}

/**
 * Delete RAG Document
 * 删除RAG文档
 * DELETE /api/admin/rag/documents/:id
 */
export async function deleteRAGDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const document = await prisma.rAGDocument.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found / 文档未找到',
      });
      return;
    }

    // Delete vectors from DashVector / 从DashVector删除向量
    try {
      await ragService.deleteDocumentVectors(id);
    } catch (error: any) {
      logger.warn('Failed to delete vectors from DashVector / 从DashVector删除向量失败', { 
        error: error.message 
      });
    }

    // Delete file from disk / 从磁盘删除文件
    try {
      await fs.unlink(document.filePath);
    } catch (error: any) {
      logger.warn('Failed to delete file from disk / 从磁盘删除文件失败', { 
        error: error.message 
      });
    }

    // Delete database record / 删除数据库记录
    await prisma.rAGDocument.delete({
      where: { id },
    });

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.SETTING,
      targetId: id,
      description: `Deleted RAG document / 删除RAG文档: ${document.name}`,
      req,
    });

    logger.info('RAG document deleted / RAG文档已删除', { documentId: id });

    res.json({
      success: true,
      message: 'Document deleted successfully / 文档删除成功',
    });
  } catch (error: any) {
    logger.error('Delete RAG document error / 删除RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete document / 删除文档失败',
    });
  }
}

/**
 * Query Similar Documents
 * 查询相似文档
 * POST /api/admin/rag/query
 */
export async function queryRAGDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { query, topK = 5 } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query text is required / 查询文本是必需的',
      });
      return;
    }

    const results = await ragService.querySimilarDocuments(query, topK);

    res.json({
      success: true,
      data: {
        query,
        results,
      },
    });
  } catch (error: any) {
    logger.error('Query RAG documents error / 查询RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to query documents / 查询文档失败',
    });
  }
}

/**
 * Get RAG Statistics
 * 获取RAG统计信息
 * GET /api/admin/rag/statistics
 */
export async function getRAGStatistics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [
      totalDocuments,
      pendingDocuments,
      processingDocuments,
      completedDocuments,
      failedDocuments,
      totalChunks,
      totalVectors,
      fileTypeStats,
    ] = await Promise.all([
      prisma.rAGDocument.count(),
      prisma.rAGDocument.count({ where: { status: 'PENDING' } }),
      prisma.rAGDocument.count({ where: { status: 'PROCESSING' } }),
      prisma.rAGDocument.count({ where: { status: 'COMPLETED' } }),
      prisma.rAGDocument.count({ where: { status: 'FAILED' } }),
      prisma.rAGDocument.aggregate({ _sum: { chunkCount: true } }),
      prisma.rAGDocument.aggregate({ _sum: { vectorCount: true } }),
      prisma.rAGDocument.groupBy({
        by: ['fileType'],
        _count: { fileType: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments,
        byStatus: {
          pending: pendingDocuments,
          processing: processingDocuments,
          completed: completedDocuments,
          failed: failedDocuments,
        },
        totalChunks: totalChunks._sum.chunkCount || 0,
        totalVectors: totalVectors._sum.vectorCount || 0,
        byFileType: fileTypeStats.map(stat => ({
          fileType: stat.fileType,
          count: stat._count.fileType,
        })),
        supportedFileTypes: SUPPORTED_FILE_TYPES,
        maxFileSize: MAX_FILE_SIZE,
      },
    });
  } catch (error: any) {
    logger.error('Get RAG statistics error / 获取RAG统计信息错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics / 获取统计信息失败',
    });
  }
}

/**
 * Update RAG Document Settings
 * 更新RAG文档设置
 * PUT /api/admin/rag/documents/:id
 */
export async function updateRAGDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, tags } = req.body;

    const document = await prisma.rAGDocument.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found / 文档未找到',
      });
      return;
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    const updatedDocument = await prisma.rAGDocument.update({
      where: { id },
      data: updateData,
    });

    // Log operation / 记录操作
    await operationLogService.logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      targetId: id,
      description: `Updated RAG document / 更新RAG文档: ${document.name}`,
      details: { updatedFields: Object.keys(updateData) },
      req,
    });

    res.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error: any) {
    logger.error('Update RAG document error / 更新RAG文档错误', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update document / 更新文档失败',
    });
  }
}

