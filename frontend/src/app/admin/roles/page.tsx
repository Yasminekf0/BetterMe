'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  _count?: { userAssignments: number };
}

interface Permission {
  key: string;
  name: string;
  module: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/roles');
      if (response.data.success) {
        setRoles(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/system/permissions');
      if (response.data.success) {
        setPermissions(response.data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await api.delete(`/system/roles/${id}`);
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500">Manage user roles and access control</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : roles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No roles found</div>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRole?.id === role.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className={`h-5 w-5 ${
                            role.isSystem ? 'text-blue-500' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{role.displayName}</p>
                            <p className="text-xs text-gray-500">{role.name}</p>
                          </div>
                        </div>
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">System</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {role._count?.userAssignments || 0} users
                        </span>
                        <span>{role.permissions.length} permissions</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedRole ? `Permissions: ${selectedRole.displayName}` : 'Select a Role'}
              </CardTitle>
              {selectedRole && !selectedRole.isSystem && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(selectedRole.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Select a role to view its permissions</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedRole.description && (
                    <p className="text-gray-600">{selectedRole.description}</p>
                  )}
                  {Object.entries(permissions).map(([module, perms]) => (
                    <div key={module}>
                      <h4 className="font-medium text-gray-900 mb-2 capitalize">{module}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const hasPermission = selectedRole.permissions.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              className={`flex items-center gap-2 p-2 rounded ${
                                hasPermission ? 'bg-green-50' : 'bg-gray-50'
                              }`}
                            >
                              <div className={`p-1 rounded ${
                                hasPermission ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className={`text-sm ${
                                hasPermission ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {perm.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

