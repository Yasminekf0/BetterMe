import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import authConfigService from '../services/authConfigService';
import mediaService from '../services/mediaService';
import pluginService from '../services/pluginService';
import articleService from '../services/articleService';
import notificationService from '../services/notificationService';
import paymentService from '../services/paymentService';
import orderService from '../services/orderService';
import membershipService from '../services/membershipService';
import roleService from '../services/roleService';
import languageService from '../services/languageService';
import { logOperation, OperationType, TargetType } from '../services/operationLogService';

/**
 * System Controller
 * Handles system-wide admin operations
 */

// ==================== Login Config ====================

export async function getLoginConfigs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await authConfigService.getAllLoginConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get login configs error', { error });
    res.status(500).json({ success: false, error: 'Failed to get login configs' });
  }
}

export async function updateLoginConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const config = await authConfigService.upsertLoginConfig(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      description: `Updated login config: ${req.body.provider}`,
      req,
    });
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update login config error', { error });
    res.status(500).json({ success: false, error: 'Failed to update login config' });
  }
}

export async function toggleLoginConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const config = await authConfigService.toggleLoginConfig(provider as any);
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Toggle login config error', { error });
    res.status(500).json({ success: false, error: 'Failed to toggle login config' });
  }
}

// ==================== Storage Config ====================

export async function getStorageConfigs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await mediaService.getAllStorageConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get storage configs error', { error });
    res.status(500).json({ success: false, error: 'Failed to get storage configs' });
  }
}

/**
 * Get storage statistics
 * 获取存储统计信息
 */
export async function getStorageStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await mediaService.getStorageStats();
    res.json({ 
      success: true, 
      data: {
        usedStorage: stats.total.size || 0,
        fileCount: stats.total.count || 0,
        totalStorage: 0, // Can be calculated from configs if needed / 可从配置中计算
      }
    });
  } catch (error) {
    logger.error('Get storage stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get storage stats' });
  }
}

export async function updateStorageConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const config = await mediaService.upsertStorageConfig(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      description: `Updated storage config: ${req.body.type}`,
      req,
    });
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update storage config error', { error });
    res.status(500).json({ success: false, error: 'Failed to update storage config' });
  }
}

/**
 * Test Aliyun OSS connection
 * 测试阿里云OSS连接
 */
export async function testOSSConnection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await mediaService.testOSSConnection();
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: result.message,
        bucketInfo: result.bucketInfo,
      });
    } else {
      res.json({ 
        success: false, 
        error: result.message,
      });
    }
  } catch (error) {
    logger.error('Test OSS connection error', { error });
    res.status(500).json({ success: false, error: 'Failed to test OSS connection' });
  }
}

// ==================== Media ====================

export async function getMedia(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, mimeType, search } = req.query;
    const result = await mediaService.getAllMedia({
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      mimeType: mimeType as string,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get media error', { error });
    res.status(500).json({ success: false, error: 'Failed to get media' });
  }
}

export async function deleteMediaItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await mediaService.deleteMedia(id);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.DELETE,
      targetType: TargetType.MEDIA,
      targetId: id,
      description: `Deleted media: ${id}`,
      req,
    });
    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    logger.error('Delete media error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete media' });
  }
}

export async function getMediaStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await mediaService.getStorageStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get media stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get media stats' });
  }
}

// ==================== Plugins ====================

export async function getPlugins(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, category, isActive, isFeatured, search } = req.query;
    const result = await pluginService.getAllPlugins({
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      category: category as any,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isFeatured: isFeatured === 'true' ? true : undefined,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get plugins error', { error });
    res.status(500).json({ success: false, error: 'Failed to get plugins' });
  }
}

export async function getPlugin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const plugin = await pluginService.getPlugin(id);
    if (!plugin) {
      res.status(404).json({ success: false, error: 'Plugin not found' });
      return;
    }
    res.json({ success: true, data: plugin });
  } catch (error) {
    logger.error('Get plugin error', { error });
    res.status(500).json({ success: false, error: 'Failed to get plugin' });
  }
}

export async function createPlugin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plugin = await pluginService.createPlugin(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.PLUGIN,
      targetId: plugin.id,
      description: `Created plugin: ${plugin.name}`,
      req,
    });
    res.status(201).json({ success: true, data: plugin });
  } catch (error) {
    logger.error('Create plugin error', { error });
    res.status(500).json({ success: false, error: 'Failed to create plugin' });
  }
}

export async function updatePlugin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const plugin = await pluginService.updatePlugin(id, req.body);
    res.json({ success: true, data: plugin });
  } catch (error) {
    logger.error('Update plugin error', { error });
    res.status(500).json({ success: false, error: 'Failed to update plugin' });
  }
}

export async function deletePlugin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pluginService.deletePlugin(id);
    res.json({ success: true, message: 'Plugin deleted' });
  } catch (error) {
    logger.error('Delete plugin error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete plugin' });
  }
}

export async function installPlugin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { config } = req.body;
    const installation = await pluginService.installPlugin(id, config);
    res.json({ success: true, data: installation });
  } catch (error) {
    logger.error('Install plugin error', { error });
    res.status(500).json({ success: false, error: 'Failed to install plugin' });
  }
}

export async function uninstallPlugin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await pluginService.uninstallPlugin(id);
    res.json({ success: true, message: 'Plugin uninstalled' });
  } catch (error) {
    logger.error('Uninstall plugin error', { error });
    res.status(500).json({ success: false, error: 'Failed to uninstall plugin' });
  }
}

export async function getInstalledPlugins(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plugins = await pluginService.getInstalledPlugins();
    res.json({ success: true, data: plugins });
  } catch (error) {
    logger.error('Get installed plugins error', { error });
    res.status(500).json({ success: false, error: 'Failed to get installed plugins' });
  }
}

// ==================== Payment Config ====================

export async function getPaymentConfigs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await paymentService.getAllPaymentConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get payment configs error', { error });
    res.status(500).json({ success: false, error: 'Failed to get payment configs' });
  }
}

export async function updatePaymentConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const config = await paymentService.upsertPaymentConfig(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.UPDATE,
      targetType: TargetType.SETTING,
      description: `Updated payment config: ${req.body.provider}`,
      req,
    });
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update payment config error', { error });
    res.status(500).json({ success: false, error: 'Failed to update payment config' });
  }
}

export async function togglePaymentConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const config = await paymentService.togglePaymentConfig(provider as any);
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Toggle payment config error', { error });
    res.status(500).json({ success: false, error: 'Failed to toggle payment config' });
  }
}

// ==================== Membership Plans ====================

export async function getMembershipPlans(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { includeInactive } = req.query;
    const plans = await membershipService.getAllMembershipPlans({
      includeInactive: includeInactive === 'true',
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    logger.error('Get membership plans error', { error });
    res.status(500).json({ success: false, error: 'Failed to get membership plans' });
  }
}

export async function createMembershipPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const plan = await membershipService.createMembershipPlan(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.MEMBERSHIP,
      targetId: plan.id,
      description: `Created membership plan: ${plan.name}`,
      req,
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    logger.error('Create membership plan error', { error });
    res.status(500).json({ success: false, error: 'Failed to create membership plan' });
  }
}

export async function updateMembershipPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const plan = await membershipService.updateMembershipPlan(id, req.body);
    res.json({ success: true, data: plan });
  } catch (error) {
    logger.error('Update membership plan error', { error });
    res.status(500).json({ success: false, error: 'Failed to update membership plan' });
  }
}

export async function deleteMembershipPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await membershipService.deleteMembershipPlan(id);
    res.json({ success: true, message: 'Membership plan deleted' });
  } catch (error) {
    logger.error('Delete membership plan error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete membership plan' });
  }
}

export async function getMembershipStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await membershipService.getMembershipStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get membership stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get membership stats' });
  }
}

// ==================== Points Config ====================

export async function getPointsConfigs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const configs = await membershipService.getAllPointsConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get points configs error', { error });
    res.status(500).json({ success: false, error: 'Failed to get points configs' });
  }
}

export async function updatePointsConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const config = await membershipService.upsertPointsConfig(req.body);
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Update points config error', { error });
    res.status(500).json({ success: false, error: 'Failed to update points config' });
  }
}

export async function deletePointsConfig(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { key } = req.params;
    await membershipService.deletePointsConfig(key);
    res.json({ success: true, message: 'Points config deleted' });
  } catch (error) {
    logger.error('Delete points config error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete points config' });
  }
}

// ==================== Roles & Permissions ====================

export async function getRoles(req: AuthRequest, res: Response): Promise<void> {
  try {
    const roles = await roleService.getAllRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    logger.error('Get roles error', { error });
    res.status(500).json({ success: false, error: 'Failed to get roles' });
  }
}

export async function getRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const role = await roleService.getRole(id);
    if (!role) {
      res.status(404).json({ success: false, error: 'Role not found' });
      return;
    }
    res.json({ success: true, data: role });
  } catch (error) {
    logger.error('Get role error', { error });
    res.status(500).json({ success: false, error: 'Failed to get role' });
  }
}

export async function createRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const role = await roleService.createRole(req.body);
    await logOperation({
      userId: req.user!.id,
      operationType: OperationType.CREATE,
      targetType: TargetType.ROLE,
      targetId: role.id,
      description: `Created role: ${role.name}`,
      req,
    });
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    logger.error('Create role error', { error });
    res.status(500).json({ success: false, error: 'Failed to create role' });
  }
}

export async function updateRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const role = await roleService.updateRole(id, req.body);
    res.json({ success: true, data: role });
  } catch (error) {
    logger.error('Update role error', { error });
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
}

export async function deleteRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await roleService.deleteRole(id);
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    logger.error('Delete role error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete role' });
  }
}

export async function getPermissions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const permissions = await roleService.getPermissionsByModule();
    res.json({ success: true, data: permissions });
  } catch (error) {
    logger.error('Get permissions error', { error });
    res.status(500).json({ success: false, error: 'Failed to get permissions' });
  }
}

// ==================== Languages ====================

export async function getLanguages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { includeDisabled } = req.query;
    const languages = await languageService.getAllLanguages({
      includeDisabled: includeDisabled === 'true',
    });
    res.json({ success: true, data: languages });
  } catch (error) {
    logger.error('Get languages error', { error });
    res.status(500).json({ success: false, error: 'Failed to get languages' });
  }
}

export async function createLanguage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const language = await languageService.createLanguage(req.body);
    res.status(201).json({ success: true, data: language });
  } catch (error) {
    logger.error('Create language error', { error });
    res.status(500).json({ success: false, error: 'Failed to create language' });
  }
}

export async function updateLanguage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const language = await languageService.updateLanguage(id, req.body);
    res.json({ success: true, data: language });
  } catch (error) {
    logger.error('Update language error', { error });
    res.status(500).json({ success: false, error: 'Failed to update language' });
  }
}

export async function setDefaultLanguage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const language = await languageService.setDefaultLanguage(id);
    res.json({ success: true, data: language });
  } catch (error) {
    logger.error('Set default language error', { error });
    res.status(500).json({ success: false, error: 'Failed to set default language' });
  }
}

export async function deleteLanguage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await languageService.deleteLanguage(id);
    res.json({ success: true, message: 'Language deleted' });
  } catch (error) {
    logger.error('Delete language error', { error });
    res.status(500).json({ success: false, error: 'Failed to delete language' });
  }
}

export async function getTranslations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { page, pageSize, languageId, namespace, search } = req.query;
    const result = await languageService.getAllTranslationsAdmin({
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      languageId: languageId as string,
      namespace: namespace as string,
      search: search as string,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get translations error', { error });
    res.status(500).json({ success: false, error: 'Failed to get translations' });
  }
}

export async function updateTranslation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const translation = await languageService.upsertTranslation(req.body);
    res.json({ success: true, data: translation });
  } catch (error) {
    logger.error('Update translation error', { error });
    res.status(500).json({ success: false, error: 'Failed to update translation' });
  }
}

export async function bulkUpdateTranslations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { languageId, translations, namespace } = req.body;
    const result = await languageService.bulkUpsertTranslations(languageId, translations, namespace);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Bulk update translations error', { error });
    res.status(500).json({ success: false, error: 'Failed to bulk update translations' });
  }
}

export async function getLanguageStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const stats = await languageService.getLanguageStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get language stats error', { error });
    res.status(500).json({ success: false, error: 'Failed to get language stats' });
  }
}

