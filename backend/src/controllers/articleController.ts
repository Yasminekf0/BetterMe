import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import articleService from '../services/articleService';
import { logOperation, OperationType, TargetType } from '../services/operationLogService';

/**
 * Article Controller
 * Handles article and category management
 */

// ==================== Categories ====================

export async function getCategories(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { includeInactive, flat } = req.query;
    const categories = await articleService.getAllCategories({
      includeInactive: includeInactive === 'true',
      flat: flat === 'true',
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Get categories error', { error });
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
}

export async function getCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const category = await articleService.getCategory(id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error('Get category error', { error });
    res.status(500).json({ success: false, error: 'Failed to get category' });
  }
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const category = await articleService.createCategory(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.ARTICLE,
      targetId: category.id,
      description: `Created article category: ${category.name}`,
      req,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    logger.error('Create category error', { error });
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const category = await articleService.updateCategory(id, req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    logger.error('Update category error', { error });
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await articleService.deleteCategory(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    logger.error('Delete category error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to delete category' });
  }
}

// ==================== Articles ====================

export async function getArticles(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, categoryId, status, authorId, search, tags } = req.query;
    const result = await articleService.getAllArticles({
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      categoryId: categoryId as string,
      status: status as any,
      authorId: authorId as string,
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get articles error', { error });
    res.status(500).json({ success: false, error: 'Failed to get articles' });
  }
}

export async function getArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const article = await articleService.getArticle(id, false);
    if (!article) {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) {
    logger.error('Get article error', { error });
    res.status(500).json({ success: false, error: 'Failed to get article' });
  }
}

export async function createArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const article = await articleService.createArticle({
      ...req.body,
      authorId: req.user!.id,
    });
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.ARTICLE,
      targetId: article.id,
      description: `Created article: ${article.title}`,
      req,
    });
    res.status(201).json({ success: true, data: article });
  } catch (error: any) {
    logger.error('Create article error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to create article' });
  }
}

export async function updateArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const article = await articleService.updateArticle(id, req.body);
    res.json({ success: true, data: article });
  } catch (error: any) {
    logger.error('Update article error', { error });
    res.status(400).json({ success: false, error: error.message || 'Failed to update article' });
  }
}

export async function deleteArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const article = await articleService.getArticle(id);
    await articleService.deleteArticle(id);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.ARTICLE,
      targetId: id,
      description: `Deleted article: ${article?.title || id}`,
      req,
    });
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    logger.error('Delete article error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete article' });
  }
}

export async function publishArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const article = await articleService.publishArticle(id);
    res.json({ success: true, data: article });
  } catch (error) {
    logger.error('Publish article error', { error });
    res.status(500).json({ success: false, error: 'Failed to publish article' });
  }
}

export async function unpublishArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const article = await articleService.unpublishArticle(id);
    res.json({ success: true, data: article });
  } catch (error) {
    logger.error('Unpublish article error', { error });
    res.status(500).json({ success: false, error: 'Failed to unpublish article' });
  }
}

export async function getArticleStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await articleService.getArticleStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get article stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get article stats' });
  }
}

// ==================== Public API ====================

export async function getPublicArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const article = await articleService.getArticle(slug, true);
    if (!article || article.status !== 'PUBLISHED') {
      res.status(404).json({ success: false, error: 'Article not found' });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) {
    logger.error('Get public article error', { error });
    res.status(500).json({ success: false, error: 'Failed to get article' });
  }
}

