import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { ArticleStatus } from '@prisma/client';

/**
 * Article Service
 * Manages articles and article categories
 */

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100);
}

// ==================== Article Categories ====================

export async function getAllCategories(options: { includeInactive?: boolean; flat?: boolean }) {
  try {
    const { includeInactive = false, flat = false } = options;
    const where: Record<string, unknown> = {};
    if (!includeInactive) where.isActive = true;

    return await prisma.articleCategory.findMany({
      where: flat ? where : { ...where, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: flat ? undefined : {
        children: { where: includeInactive ? {} : { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { articles: true } },
      },
    });
  } catch (error) {
    logger.error('Get all categories error', { error });
    throw error;
  }
}

export async function getCategory(idOrSlug: string) {
  try {
    return await prisma.articleCategory.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        parent: true,
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { articles: true } },
      },
    });
  } catch (error) {
    logger.error('Get category error', { error, idOrSlug });
    throw error;
  }
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}) {
  try {
    const slug = data.slug || generateSlug(data.name);
    const existing = await prisma.articleCategory.findUnique({ where: { slug } });
    if (existing) throw new Error('Slug already exists');

    const category = await prisma.articleCategory.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    logger.info('Category created', { categoryId: category.id });
    return category;
  } catch (error) {
    logger.error('Create category error', { error });
    throw error;
  }
}

export async function updateCategory(id: string, data: Partial<{
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}>) {
  try {
    if (data.slug) {
      const existing = await prisma.articleCategory.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) throw new Error('Slug already exists');
    }
    const category = await prisma.articleCategory.update({ where: { id }, data });
    logger.info('Category updated', { categoryId: id });
    return category;
  } catch (error) {
    logger.error('Update category error', { error, id });
    throw error;
  }
}

export async function deleteCategory(id: string) {
  try {
    const articlesCount = await prisma.article.count({ where: { categoryId: id } });
    if (articlesCount > 0) throw new Error('Cannot delete category with articles');
    const childrenCount = await prisma.articleCategory.count({ where: { parentId: id } });
    if (childrenCount > 0) throw new Error('Cannot delete category with subcategories');
    await prisma.articleCategory.delete({ where: { id } });
    logger.info('Category deleted', { categoryId: id });
    return true;
  } catch (error) {
    logger.error('Delete category error', { error, id });
    throw error;
  }
}

// ==================== Articles ====================

export async function getAllArticles(options: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  status?: ArticleStatus;
  authorId?: string;
  search?: string;
  tags?: string[];
}) {
  try {
    const { page = 1, pageSize = 20, categoryId, status, authorId, search, tags } = options;
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (tags && tags.length > 0) where.tags = { hasSome: tags };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    logger.error('Get all articles error', { error });
    throw error;
  }
}

export async function getArticle(idOrSlug: string, incrementView = false) {
  try {
    const article = await prisma.article.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (article && incrementView) {
      await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      });
    }
    return article;
  } catch (error) {
    logger.error('Get article error', { error, idOrSlug });
    throw error;
  }
}

export async function createArticle(data: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId?: string;
  authorId: string;
  status?: ArticleStatus;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}) {
  try {
    const slug = data.slug || generateSlug(data.title);
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) throw new Error('Slug already exists');

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        categoryId: data.categoryId,
        authorId: data.authorId,
        status: data.status ?? 'DRAFT',
        tags: data.tags ?? [],
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    });
    logger.info('Article created', { articleId: article.id });
    return article;
  } catch (error) {
    logger.error('Create article error', { error });
    throw error;
  }
}

export async function updateArticle(id: string, data: Partial<{
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  categoryId: string | null;
  status: ArticleStatus;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}>) {
  try {
    if (data.slug) {
      const existing = await prisma.article.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) throw new Error('Slug already exists');
    }

    // If publishing, set publishedAt
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'PUBLISHED') {
      const article = await prisma.article.findUnique({ where: { id } });
      if (article && !article.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const article = await prisma.article.update({ where: { id }, data: updateData });
    logger.info('Article updated', { articleId: id });
    return article;
  } catch (error) {
    logger.error('Update article error', { error, id });
    throw error;
  }
}

export async function deleteArticle(id: string) {
  try {
    await prisma.article.delete({ where: { id } });
    logger.info('Article deleted', { articleId: id });
    return true;
  } catch (error) {
    logger.error('Delete article error', { error, id });
    throw error;
  }
}

export async function publishArticle(id: string) {
  try {
    const article = await prisma.article.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    logger.info('Article published', { articleId: id });
    return article;
  } catch (error) {
    logger.error('Publish article error', { error, id });
    throw error;
  }
}

export async function unpublishArticle(id: string) {
  try {
    const article = await prisma.article.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
    logger.info('Article unpublished', { articleId: id });
    return article;
  } catch (error) {
    logger.error('Unpublish article error', { error, id });
    throw error;
  }
}

export async function getArticleStats() {
  try {
    const [totalCount, publishedCount, draftCount, totalViews] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
    ]);

    const topArticles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, viewCount: true },
    });

    return {
      totalCount,
      publishedCount,
      draftCount,
      totalViews: totalViews._sum.viewCount || 0,
      topArticles,
    };
  } catch (error) {
    logger.error('Get article stats error', { error });
    throw error;
  }
}

export default {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
  getArticleStats,
};

