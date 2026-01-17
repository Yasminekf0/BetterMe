/**
 * RAG Routes - Document Upload and Management API
 * RAG路由 - 文档上传和管理API
 * 
 * All routes require authentication and admin/trainer role
 * 所有路由需要认证和管理员/培训师角色
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate, adminOnly, trainerOrAdmin } from '../middleware/auth';
import {
  uploadRAGDocument,
  getRAGDocuments,
  getRAGDocument,
  getRAGDocumentChunks,
  updateRAGDocument,
  deleteRAGDocument,
  reprocessRAGDocument,
  queryRAGDocuments,
  getRAGStatistics,
} from '../controllers/ragController';

const router = Router();

// ==================== Multer Configuration / Multer配置 ====================

// Use memory storage for file uploads / 使用内存存储上传的文件
const storage = multer.memoryStorage();

// File filter to accept supported types / 文件过滤器接受支持的类型
const fileFilter = (
  req: Express.Request, 
  file: Express.Multer.File, 
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream', // For unknown types / 用于未知类型
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Multer upload configuration / Multer上传配置
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.RAG_MAX_FILE_SIZE || '52428800', 10), // 50MB default / 默认50MB
  },
});

// ==================== Apply Authentication / 应用认证 ====================

router.use(authenticate);

// ==================== RAG Document Routes / RAG文档路由 ====================

/**
 * @swagger
 * /api/admin/rag/statistics:
 *   get:
 *     summary: Get RAG Statistics
 *     description: Get statistics about RAG documents and vectors
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', trainerOrAdmin, getRAGStatistics);

/**
 * @swagger
 * /api/admin/rag/documents:
 *   get:
 *     summary: Get All RAG Documents
 *     description: Get list of all uploaded RAG documents with pagination
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED]
 *         description: Filter by status
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *         description: Filter by file type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/documents', trainerOrAdmin, getRAGDocuments);

/**
 * @swagger
 * /api/admin/rag/documents/{id}:
 *   get:
 *     summary: Get RAG Document by ID
 *     description: Get details of a specific RAG document
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document not found
 */
router.get('/documents/:id', trainerOrAdmin, getRAGDocument);

/**
 * @swagger
 * /api/admin/rag/documents/{id}/chunks:
 *   get:
 *     summary: Get RAG Document Chunks
 *     description: Get all chunks of a specific RAG document
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Chunks retrieved successfully
 *       404:
 *         description: Document not found
 */
router.get('/documents/:id/chunks', trainerOrAdmin, getRAGDocumentChunks);

/**
 * @swagger
 * /api/admin/rag/upload:
 *   post:
 *     summary: Upload RAG Document
 *     description: Upload a document for RAG processing
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, Word, PPT, Excel, TXT)
 *               name:
 *                 type: string
 *                 description: Display name for the document
 *               description:
 *                 type: string
 *                 description: Document description
 *               chunkSize:
 *                 type: integer
 *                 default: 500
 *                 description: Size of each text chunk in characters
 *               chunkOverlap:
 *                 type: integer
 *                 default: 50
 *                 description: Overlap between chunks in characters
 *               autoProcess:
 *                 type: string
 *                 default: "true"
 *                 description: Whether to process document immediately
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file or parameters
 */
router.post('/upload', trainerOrAdmin, upload.single('file'), uploadRAGDocument);

/**
 * @swagger
 * /api/admin/rag/documents/{id}:
 *   put:
 *     summary: Update RAG Document
 *     description: Update document name, description, or tags
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 */
router.put('/documents/:id', trainerOrAdmin, updateRAGDocument);

/**
 * @swagger
 * /api/admin/rag/documents/{id}/reprocess:
 *   post:
 *     summary: Reprocess RAG Document
 *     description: Re-chunk and re-vectorize a document
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chunkSize:
 *                 type: integer
 *                 description: New chunk size
 *               chunkOverlap:
 *                 type: integer
 *                 description: New chunk overlap
 *     responses:
 *       200:
 *         description: Reprocessing started
 *       404:
 *         description: Document not found
 */
router.post('/documents/:id/reprocess', trainerOrAdmin, reprocessRAGDocument);

/**
 * @swagger
 * /api/admin/rag/documents/{id}:
 *   delete:
 *     summary: Delete RAG Document
 *     description: Delete a document and its vectors
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
router.delete('/documents/:id', adminOnly, deleteRAGDocument);

/**
 * @swagger
 * /api/admin/rag/query:
 *   post:
 *     summary: Query Similar Documents
 *     description: Search for similar documents using vector similarity
 *     tags: [RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query text
 *               topK:
 *                 type: integer
 *                 default: 5
 *                 description: Number of results to return
 *     responses:
 *       200:
 *         description: Query results
 *       400:
 *         description: Query text required
 */
router.post('/query', trainerOrAdmin, queryRAGDocuments);

export default router;

