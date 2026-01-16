'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Power, Cloud, HardDrive, Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface StorageConfig {
  provider: string;
  name: string;
  isEnabled: boolean;
  isDefault: boolean;
  bucketName?: string;
  region?: string;
}

export default function StoragePage() {
  const [configs, setConfigs] = useState<StorageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStorage: 0, usedStorage: 0, fileCount: 0 });

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/storage-configs');
      if (response.data.success) {
        setConfigs(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/system/storage-configs/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleToggle = async (provider: string) => {
    try {
      await api.put(`/system/storage-configs/${provider}/toggle`);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to toggle config:', error);
    }
  };

  const handleSetDefault = async (provider: string) => {
    try {
      await api.put(`/system/storage-configs/${provider}/default`);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'LOCAL':
        return <HardDrive className="h-8 w-8 text-gray-500" />;
      case 'ALIYUN_OSS':
        return <Cloud className="h-8 w-8 text-orange-500" />;
      case 'AWS_S3':
        return <Cloud className="h-8 w-8 text-yellow-600" />;
      case 'QINIU':
        return <Cloud className="h-8 w-8 text-blue-500" />;
      default:
        return <Server className="h-8 w-8 text-gray-400" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'LOCAL':
        return 'Store files on local server storage';
      case 'ALIYUN_OSS':
        return 'Alibaba Cloud Object Storage Service';
      case 'AWS_S3':
        return 'Amazon Web Services S3 storage';
      case 'QINIU':
        return 'Qiniu Cloud Storage (七牛云)';
      default:
        return '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage Configuration</h1>
          <p className="text-gray-500">Configure file storage providers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <HardDrive className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatSize(stats.usedStorage || 0)}</p>
                <p className="text-sm text-gray-500">Used Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.fileCount || 0}</p>
              <p className="text-sm text-gray-500">Total Files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {configs.filter(c => c.isEnabled).length}
              </p>
              <p className="text-sm text-gray-500">Active Providers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storage Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No storage providers configured</div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.provider}
                  className={`p-4 border rounded-lg ${
                    config.isDefault ? 'border-blue-500 bg-blue-50' : 
                    config.isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getProviderIcon(config.provider)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{config.name}</h3>
                          {config.isDefault && (
                            <Badge variant="primary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {getProviderDescription(config.provider)}
                        </p>
                        {config.bucketName && (
                          <p className="text-xs text-gray-400 mt-1">
                            Bucket: {config.bucketName} {config.region && `(${config.region})`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.isEnabled ? 'success' : 'secondary'}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      {config.isEnabled && !config.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(config.provider)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant={config.isEnabled ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggle(config.provider)}
                      >
                        <Power className="h-4 w-4 mr-1" />
                        {config.isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

