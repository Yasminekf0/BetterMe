import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth';
import {
  // Login Config
  getLoginConfigs,
  updateLoginConfig,
  toggleLoginConfig,
  // Storage Config
  getStorageConfigs,
  updateStorageConfig,
  // Media
  getMedia,
  deleteMediaItem,
  getMediaStats,
  // Plugins
  getPlugins,
  getPlugin,
  createPlugin,
  updatePlugin,
  deletePlugin,
  installPlugin,
  uninstallPlugin,
  getInstalledPlugins,
  // Payment Config
  getPaymentConfigs,
  updatePaymentConfig,
  togglePaymentConfig,
  // Membership Plans
  getMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
  getMembershipStats,
  // Points Config
  getPointsConfigs,
  updatePointsConfig,
  deletePointsConfig,
  // Roles & Permissions
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  // Languages
  getLanguages,
  createLanguage,
  updateLanguage,
  setDefaultLanguage,
  deleteLanguage,
  getTranslations,
  updateTranslation,
  bulkUpdateTranslations,
  getLanguageStats,
} from '../controllers/systemController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(adminOnly);

// ==================== Login Configuration ====================
router.get('/login-configs', getLoginConfigs);
router.put('/login-configs', updateLoginConfig);
router.put('/login-configs/:provider/toggle', toggleLoginConfig);

// ==================== Storage Configuration ====================
router.get('/storage-configs', getStorageConfigs);
router.put('/storage-configs', updateStorageConfig);

// ==================== Media Management ====================
router.get('/media', getMedia);
router.get('/media/stats', getMediaStats);
router.delete('/media/:id', deleteMediaItem);

// ==================== Plugin Management ====================
router.get('/plugins', getPlugins);
router.get('/plugins/installed', getInstalledPlugins);
router.get('/plugins/:id', getPlugin);
router.post('/plugins', createPlugin);
router.put('/plugins/:id', updatePlugin);
router.delete('/plugins/:id', deletePlugin);
router.post('/plugins/:id/install', installPlugin);
router.post('/plugins/:id/uninstall', uninstallPlugin);

// ==================== Payment Configuration ====================
router.get('/payment-configs', getPaymentConfigs);
router.put('/payment-configs', updatePaymentConfig);
router.put('/payment-configs/:provider/toggle', togglePaymentConfig);

// ==================== Membership Plans ====================
router.get('/membership-plans', getMembershipPlans);
router.get('/membership-plans/stats', getMembershipStats);
router.post('/membership-plans', createMembershipPlan);
router.put('/membership-plans/:id', updateMembershipPlan);
router.delete('/membership-plans/:id', deleteMembershipPlan);

// ==================== Points Configuration ====================
router.get('/points-configs', getPointsConfigs);
router.put('/points-configs', updatePointsConfig);
router.delete('/points-configs/:key', deletePointsConfig);

// ==================== Roles & Permissions ====================
router.get('/roles', getRoles);
router.get('/roles/:id', getRole);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);
router.get('/permissions', getPermissions);

// ==================== Language Settings ====================
router.get('/languages', getLanguages);
router.get('/languages/stats', getLanguageStats);
router.post('/languages', createLanguage);
router.put('/languages/:id', updateLanguage);
router.put('/languages/:id/default', setDefaultLanguage);
router.delete('/languages/:id', deleteLanguage);

// ==================== Translations ====================
router.get('/translations', getTranslations);
router.put('/translations', updateTranslation);
router.post('/translations/bulk', bulkUpdateTranslations);

export default router;

