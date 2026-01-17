'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Power, Cloud, HardDrive, Server, X, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

interface StorageConfig {
  id: string;
  type: string;         // Storage type: LOCAL, ALIYUN_OSS, AWS_S3
  name: string;
  isEnabled: boolean;
  isDefault: boolean;
  // Aliyun OSS config / 阿里云OSS配置
  accessKeyId?: string;
  accessKeySecret?: string;
  endpoint?: string;
  bucket?: string;
  region?: string;
  // AWS S3 config
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsBucket?: string;
  // Common / 通用配置
  baseUrl?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

export default function StoragePage() {
  const [configs, setConfigs] = useState<StorageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStorage: 0, usedStorage: 0, fileCount: 0 });
  
  // Modal state / 模态框状态
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<StorageConfig | null>(null);
  const [formData, setFormData] = useState<Partial<StorageConfig>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const handleToggle = async (type: string) => {
    try {
      const config = configs.find(c => c.type === type);
      if (config) {
        await api.put('/system/storage-configs', {
          type,
          name: config.name,
          isEnabled: !config.isEnabled,
        });
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to toggle config:', error);
    }
  };

  const handleSetDefault = async (type: string) => {
    try {
      const config = configs.find(c => c.type === type);
      if (config) {
        await api.put('/system/storage-configs', {
          type,
          name: config.name,
          isDefault: true,
        });
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  // Open configure modal / 打开配置模态框
  const handleConfigure = (config: StorageConfig) => {
    setEditingConfig(config);
    setFormData({
      type: config.type,
      name: config.name,
      isEnabled: config.isEnabled,
      isDefault: config.isDefault,
      accessKeyId: config.accessKeyId || '',
      accessKeySecret: config.accessKeySecret || '',
      endpoint: config.endpoint || '',
      bucket: config.bucket || '',
      region: config.region || '',
      awsAccessKeyId: config.awsAccessKeyId || '',
      awsSecretAccessKey: config.awsSecretAccessKey || '',
      awsRegion: config.awsRegion || '',
      awsBucket: config.awsBucket || '',
      baseUrl: config.baseUrl || '',
      maxFileSize: config.maxFileSize || 10485760,
    });
    setTestResult(null);
    setShowConfigModal(true);
  };

  // Save configuration / 保存配置
  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    
    try {
      setSaving(true);
      await api.put('/system/storage-configs', {
        ...formData,
        type: editingConfig.type,
      });
      setShowConfigModal(false);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Test connection / 测试连接
  const handleTestConnection = async () => {
    if (!editingConfig || editingConfig.type !== 'ALIYUN_OSS') return;
    
    try {
      setTesting(true);
      setTestResult(null);
      
      // First save the config / 先保存配置
      await api.put('/system/storage-configs', {
        ...formData,
        type: editingConfig.type,
      });
      
      // Then test connection / 然后测试连接
      const response = await api.post('/system/storage-configs/test-oss');
      
      if (response.data.success) {
        setTestResult({
          success: true,
          message: response.data.message || 'Connection successful! / 连接成功！',
        });
      } else {
        setTestResult({
          success: false,
          message: response.data.error || 'Connection failed / 连接失败',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setTestResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setTesting(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'LOCAL':
        return <HardDrive className="h-8 w-8 text-gray-500" />;
      case 'ALIYUN_OSS':
        return <Cloud className="h-8 w-8 text-orange-500" />;
      case 'AWS_S3':
        return <Cloud className="h-8 w-8 text-yellow-600" />;
      default:
        return <Server className="h-8 w-8 text-gray-400" />;
    }
  };

  const getProviderDescription = (type: string) => {
    switch (type) {
      case 'LOCAL':
        return 'Store files on local server storage';
      case 'ALIYUN_OSS':
        return 'Alibaba Cloud Object Storage Service (阿里云对象存储)';
      case 'AWS_S3':
        return 'Amazon Web Services S3 storage';
      default:
        return '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  // Render config form fields based on type / 根据类型渲染配置表单字段
  const renderConfigFields = () => {
    if (!editingConfig) return null;

    switch (editingConfig.type) {
      case 'ALIYUN_OSS':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Key ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.accessKeyId || ''}
                  onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
                  placeholder="LTAI5t..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Key Secret <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.accessKeySecret || ''}
                  onChange={(e) => setFormData({ ...formData, accessKeySecret: e.target.value })}
                  placeholder="Enter secret key"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="oss-cn-hangzhou"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., oss-cn-hangzhou, oss-cn-shanghai</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bucket Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.bucket || ''}
                  onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
                  placeholder="my-bucket"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint (Optional)
              </label>
              <Input
                type="text"
                value={formData.endpoint || ''}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://oss-cn-hangzhou.aliyuncs.com"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use default endpoint based on region</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Domain / CDN URL (Optional)
              </label>
              <Input
                type="text"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://cdn.example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Custom domain for accessing files (CDN recommended)</p>
            </div>
          </div>
        );

      case 'AWS_S3':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Access Key ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.awsAccessKeyId || ''}
                  onChange={(e) => setFormData({ ...formData, awsAccessKeyId: e.target.value })}
                  placeholder="AKIA..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Secret Access Key <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.awsSecretAccessKey || ''}
                  onChange={(e) => setFormData({ ...formData, awsSecretAccessKey: e.target.value })}
                  placeholder="Enter secret key"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AWS Region <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.awsRegion || ''}
                  onChange={(e) => setFormData({ ...formData, awsRegion: e.target.value })}
                  placeholder="us-east-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  S3 Bucket Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.awsBucket || ''}
                  onChange={(e) => setFormData({ ...formData, awsBucket: e.target.value })}
                  placeholder="my-s3-bucket"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Domain / CloudFront URL (Optional)
              </label>
              <Input
                type="text"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://cdn.example.com"
              />
            </div>
          </div>
        );

      case 'LOCAL':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Local storage uses the server&apos;s file system. Files are stored in the <code className="bg-gray-200 px-1 rounded">uploads/</code> directory.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL (Optional)
              </label>
              <Input
                type="text"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.example.com/uploads"
              />
              <p className="text-xs text-gray-500 mt-1">Public URL prefix for accessing uploaded files</p>
            </div>
          </div>
        );

      default:
        return null;
    }
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
                  key={config.type}
                  className={`p-4 border rounded-lg ${
                    config.isDefault ? 'border-blue-500 bg-blue-50' : 
                    config.isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getProviderIcon(config.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{config.name}</h3>
                          {config.isDefault && (
                            <Badge variant="primary">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {getProviderDescription(config.type)}
                        </p>
                        {config.bucket && (
                          <p className="text-xs text-gray-400 mt-1">
                            Bucket: {config.bucket} {config.region && `(${config.region})`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.isEnabled ? 'success' : 'secondary'}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigure(config)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      {config.isEnabled && !config.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(config.type)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant={config.isEnabled ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggle(config.type)}
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

      {/* Configuration Modal / 配置模态框 */}
      {showConfigModal && editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {getProviderIcon(editingConfig.type)}
                <div>
                  <h2 className="text-lg font-semibold">Configure {editingConfig.name}</h2>
                  <p className="text-sm text-gray-500">{getProviderDescription(editingConfig.type)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {renderConfigFields()}

              {/* Test Result / 测试结果 */}
              {testResult && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div>
                {editingConfig.type === 'ALIYUN_OSS' && (
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || !formData.accessKeyId || !formData.accessKeySecret || !formData.bucket || !formData.region}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveConfig}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
