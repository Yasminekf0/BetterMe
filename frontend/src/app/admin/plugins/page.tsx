'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, Power, Settings, Puzzle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface Plugin {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  version: string;
  author: string;
  category: string;
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  downloadCount: number;
}

interface PluginInstallation {
  pluginId: string;
  isEnabled: boolean;
  plugin: Plugin;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installed, setInstalled] = useState<PluginInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace');

  useEffect(() => {
    fetchPlugins();
    fetchInstalled();
  }, [search]);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/plugins', {
        params: { search: search || undefined }
      });
      if (response.data.success) {
        setPlugins(response.data.data.items || response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstalled = async () => {
    try {
      const response = await api.get('/system/plugins/installed');
      if (response.data.success) {
        setInstalled(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch installed plugins:', error);
    }
  };

  const handleInstall = async (pluginId: string) => {
    try {
      await api.post(`/system/plugins/${pluginId}/install`);
      fetchInstalled();
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) return;
    try {
      await api.post(`/system/plugins/${pluginId}/uninstall`);
      fetchInstalled();
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const isInstalled = (pluginId: string) => {
    return installed.some(i => i.pluginId === pluginId);
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'AI_TOOLS': 'primary',
      'ANALYTICS': 'success',
      'COMMUNICATION': 'warning',
      'PRODUCTIVITY': 'secondary',
    };
    return <Badge variant={colors[category] as any || 'secondary'}>{category.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plugins</h1>
          <p className="text-gray-500">Extend functionality with plugins</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            activeTab === 'marketplace'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            activeTab === 'installed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Installed ({installed.length})
        </button>
      </div>

      {activeTab === 'marketplace' && (
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search plugins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : plugins.length === 0 ? (
              <div className="text-center py-8">
                <Puzzle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No plugins available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">{plugin.icon || '🧩'}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                        <p className="text-xs text-gray-500">by {plugin.author}</p>
                      </div>
                      {plugin.isFeatured && (
                        <Badge variant="warning">Featured</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {plugin.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(plugin.category)}
                        <span className="text-xs text-gray-400">v{plugin.version}</span>
                      </div>
                      {isInstalled(plugin.id) ? (
                        <Badge variant="success">Installed</Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleInstall(plugin.id)}>
                          <Download className="h-4 w-4 mr-1" />
                          {plugin.price > 0 ? `$${plugin.price}` : 'Free'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'installed' && (
        <Card>
          <CardContent className="pt-6">
            {installed.length === 0 ? (
              <div className="text-center py-8">
                <Puzzle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No plugins installed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {installed.map((installation) => (
                  <div
                    key={installation.pluginId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{installation.plugin.icon || '🧩'}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{installation.plugin.name}</h3>
                        <p className="text-sm text-gray-500">{installation.plugin.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={installation.isEnabled ? 'success' : 'secondary'}>
                        {installation.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUninstall(installation.pluginId)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

