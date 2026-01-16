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
// Get published article by slug (no auth required)
router.get('/public/:slug', getPublicArticle);

// ==================== Admin Routes ====================
router.use(authenticate);

// Categories
router.get('/categories', trainerOrAdmin, getCategories);
router.get('/categories/:id', trainerOrAdmin, getCategory);
router.post('/categories', adminOnly, createCategory);
router.put('/categories/:id', adminOnly, updateCategory);
router.delete('/categories/:id', adminOnly, deleteCategory);

// Articles
router.get('/', trainerOrAdmin, getArticles);
router.get('/stats', adminOnly, getArticleStats);
router.get('/:id', trainerOrAdmin, getArticle);
router.post('/', trainerOrAdmin, createArticle);
router.put('/:id', trainerOrAdmin, updateArticle);
router.delete('/:id', adminOnly, deleteArticle);
router.put('/:id/publish', trainerOrAdmin, publishArticle);
router.put('/:id/unpublish', trainerOrAdmin, unpublishArticle);

export default router;

