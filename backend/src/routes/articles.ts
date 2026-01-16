import { Router } from 'express';
import { authenticate, adminOnly, trainerOrAdmin } from '../middleware/auth';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  getArticleStats,
  getPublicArticle,
} from '../controllers/articleController';

const router = Router();

// ==================== Public Routes ====================

/**
 * @swagger
 * /articles/public/{slug}:
 *   get:
 *     summary: Get published article by slug
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Article slug
 *     responses:
 *       200:
 *         description: Article found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Article not found
 */
router.get('/public/:slug', getPublicArticle);

// ==================== Admin Routes ====================

/**
router.use(authenticate);
 * @swagger
 * /articles/categories:
 *   get:
 *     summary: Get all article categories
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive categories
 *       - in: query
 *         name: flat
 *         schema:
 *           type: boolean
 *         description: Return flat structure without hierarchy
 *     responses:
 *       200:
 *         description: List of categories
 *       401:
 *         description: Unauthorized
 */
router.get('/categories', trainerOrAdmin, getCategories);

/**
 * @swagger
 * /articles/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/categories/:id', trainerOrAdmin, getCategory);

/**
 * @swagger
 * /articles/categories:
 *   post:
 *     summary: Create new article category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               sortOrder:
 *                 type: number
 *     responses:
 *       201:
 *         description: Category created
 *       401:
 *         description: Unauthorized
 */
router.post('/categories', adminOnly, createCategory);

/**
 * @swagger
 * /articles/categories/{id}:
 *   put:
 *     summary: Update article category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *               sortOrder:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/categories/:id', adminOnly, updateCategory);

/**
 * @swagger
 * /articles/categories/{id}:
 *   delete:
 *     summary: Delete article category
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete('/categories/:id', adminOnly, deleteCategory);

// Articles

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get all articles with pagination and filtering
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED]
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *           description: Comma-separated tags
 *     responses:
 *       200:
 *         description: List of articles
 */
router.get('/', trainerOrAdmin, getArticles);

/**
 * @swagger
 * /articles/stats:
 *   get:
 *     summary: Get article statistics
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Article statistics
 */
router.get('/stats', adminOnly, getArticleStats);

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get article by ID or slug
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article details
 *       404:
 *         description: Article not found
 */
router.get('/:id', trainerOrAdmin, getArticle);

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create new article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               seoTitle:
 *                 type: string
 *               seoDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/', trainerOrAdmin, createArticle);

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               seoTitle:
 *                 type: string
 *               seoDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article updated
 */
router.put('/:id', trainerOrAdmin, updateArticle);

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article deleted
 */
router.delete('/:id', adminOnly, deleteArticle);

/**
 * @swagger
 * /articles/{id}/publish:
 *   put:
 *     summary: Publish article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article published
 */
router.put('/:id/publish', trainerOrAdmin, publishArticle);

/**
 * @swagger
 * /articles/{id}/unpublish:
 *   put:
 *     summary: Unpublish article
 *     tags:
 *       - Articles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article unpublished
 */
router.put('/:id/unpublish', trainerOrAdmin, unpublishArticle);

export default router;

