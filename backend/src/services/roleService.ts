import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Role Service
 * Manages roles and permissions
 */

// Default system permissions
export const SYSTEM_PERMISSIONS = [
  // Dashboard
  { key: 'dashboard.view', name: 'View Dashboard', module: 'dashboard' },
  // Users
  { key: 'users.view', name: 'View Users', module: 'users' },
  { key: 'users.create', name: 'Create Users', module: 'users' },
  { key: 'users.edit', name: 'Edit Users', module: 'users' },
  { key: 'users.delete', name: 'Delete Users', module: 'users' },
  // Scenarios
  { key: 'scenarios.view', name: 'View Scenarios', module: 'scenarios' },
  { key: 'scenarios.create', name: 'Create Scenarios', module: 'scenarios' },
  { key: 'scenarios.edit', name: 'Edit Scenarios', module: 'scenarios' },
  { key: 'scenarios.delete', name: 'Delete Scenarios', module: 'scenarios' },
  // Articles
  { key: 'articles.view', name: 'View Articles', module: 'articles' },
  { key: 'articles.create', name: 'Create Articles', module: 'articles' },
  { key: 'articles.edit', name: 'Edit Articles', module: 'articles' },
  { key: 'articles.delete', name: 'Delete Articles', module: 'articles' },
  // Notifications
  { key: 'notifications.view', name: 'View Notifications', module: 'notifications' },
  { key: 'notifications.send', name: 'Send Notifications', module: 'notifications' },
  // Orders
  { key: 'orders.view', name: 'View Orders', module: 'orders' },
  { key: 'orders.manage', name: 'Manage Orders', module: 'orders' },
  // Media
  { key: 'media.view', name: 'View Media', module: 'media' },
  { key: 'media.upload', name: 'Upload Media', module: 'media' },
  { key: 'media.delete', name: 'Delete Media', module: 'media' },
  // Plugins
  { key: 'plugins.view', name: 'View Plugins', module: 'plugins' },
  { key: 'plugins.manage', name: 'Manage Plugins', module: 'plugins' },
  // Settings
  { key: 'settings.view', name: 'View Settings', module: 'settings' },
  { key: 'settings.edit', name: 'Edit Settings', module: 'settings' },
  // Roles
  { key: 'roles.view', name: 'View Roles', module: 'roles' },
  { key: 'roles.manage', name: 'Manage Roles', module: 'roles' },
  // Logs
  { key: 'logs.view', name: 'View Logs', module: 'logs' },
];

// Default system roles
const DEFAULT_ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.key),
  },
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access',
    isSystem: true,
    permissions: SYSTEM_PERMISSIONS.filter(p => !p.key.includes('roles.manage')).map(p => p.key),
  },
  {
    name: 'trainer',
    displayName: 'Trainer',
    description: 'Trainer access for managing scenarios and viewing users',
    isSystem: true,
    permissions: [
      'dashboard.view', 'users.view', 'scenarios.view', 'scenarios.create',
      'scenarios.edit', 'articles.view', 'notifications.view', 'media.view', 'media.upload',
    ],
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'Basic user access',
    isSystem: true,
    permissions: ['dashboard.view'],
  },
];

// ==================== Permissions ====================

export async function getAllPermissions() {
  try {
    return await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
    });
  } catch (error) {
    logger.error('Get all permissions error', { error });
    throw error;
  }
}

export async function getPermissionsByModule() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
    });

    // Group by module
    const grouped: Record<string, typeof permissions> = {};
    for (const permission of permissions) {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    }

    return grouped;
  } catch (error) {
    logger.error('Get permissions by module error', { error });
    throw error;
  }
}

export async function initializePermissions() {
  try {
    for (let i = 0; i < SYSTEM_PERMISSIONS.length; i++) {
      const permission = SYSTEM_PERMISSIONS[i];
      const existing = await prisma.permission.findUnique({
        where: { key: permission.key },
      });

      if (!existing) {
        await prisma.permission.create({
          data: {
            key: permission.key,
            name: permission.name,
            module: permission.module,
            sortOrder: i,
          },
        });
      }
    }
    logger.info('Permissions initialized');
  } catch (error) {
    logger.error('Initialize permissions error', { error });
  }
}

// ==================== Roles ====================

export async function getAllRoles() {
  try {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { userAssignments: true } },
      },
    });
  } catch (error) {
    logger.error('Get all roles error', { error });
    throw error;
  }
}

export async function getRole(idOrName: string) {
  try {
    return await prisma.role.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
      include: {
        userAssignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          take: 10,
        },
      },
    });
  } catch (error) {
    logger.error('Get role error', { error, idOrName });
    throw error;
  }
}

export async function createRole(data: {
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
}) {
  try {
    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new Error('Role name already exists');

    const role = await prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissions: data.permissions,
        isSystem: false,
      },
    });

    logger.info('Role created', { roleId: role.id, name: role.name });
    return role;
  } catch (error) {
    logger.error('Create role error', { error });
    throw error;
  }
}

export async function updateRole(id: string, data: Partial<{
  displayName: string;
  description: string;
  permissions: string[];
}>) {
  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new Error('Role not found');
    if (role.isSystem && data.permissions) {
      // Allow updating permissions for system roles except super_admin
      if (role.name === 'super_admin') {
        throw new Error('Cannot modify super admin permissions');
      }
    }

    const updated = await prisma.role.update({ where: { id }, data });
    logger.info('Role updated', { roleId: id });
    return updated;
  } catch (error) {
    logger.error('Update role error', { error, id });
    throw error;
  }
}

export async function deleteRole(id: string) {
  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot delete system role');

    // Check if any users have this role
    const assignmentsCount = await prisma.userRoleAssignment.count({
      where: { roleId: id },
    });
    if (assignmentsCount > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    await prisma.role.delete({ where: { id } });
    logger.info('Role deleted', { roleId: id });
    return true;
  } catch (error) {
    logger.error('Delete role error', { error, id });
    throw error;
  }
}

export async function initializeRoles() {
  try {
    for (const roleData of DEFAULT_ROLES) {
      const existing = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existing) {
        await prisma.role.create({ data: roleData });
      }
    }
    logger.info('Roles initialized');
  } catch (error) {
    logger.error('Initialize roles error', { error });
  }
}

// ==================== User Role Assignments ====================

export async function assignRoleToUser(userId: string, roleId: string) {
  try {
    const assignment = await prisma.userRoleAssignment.create({
      data: { userId, roleId },
    });
    logger.info('Role assigned to user', { userId, roleId });
    return assignment;
  } catch (error) {
    logger.error('Assign role to user error', { error, userId, roleId });
    throw error;
  }
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  try {
    await prisma.userRoleAssignment.delete({
      where: { userId_roleId: { userId, roleId } },
    });
    logger.info('Role removed from user', { userId, roleId });
    return true;
  } catch (error) {
    logger.error('Remove role from user error', { error, userId, roleId });
    throw error;
  }
}

export async function getUserRoles(userId: string) {
  try {
    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });
    return assignments.map(a => a.role);
  } catch (error) {
    logger.error('Get user roles error', { error, userId });
    throw error;
  }
}

export async function getUserPermissions(userId: string) {
  try {
    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });

    // Collect all unique permissions from all roles
    const permissions = new Set<string>();
    for (const assignment of assignments) {
      for (const permission of assignment.role.permissions) {
        permissions.add(permission);
      }
    }

    return Array.from(permissions);
  } catch (error) {
    logger.error('Get user permissions error', { error, userId });
    throw error;
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.includes(permission);
  } catch (error) {
    logger.error('Check permission error', { error, userId, permission });
    return false;
  }
}

export default {
  SYSTEM_PERMISSIONS,
  getAllPermissions,
  getPermissionsByModule,
  initializePermissions,
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  initializeRoles,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getUserPermissions,
  hasPermission,
};

