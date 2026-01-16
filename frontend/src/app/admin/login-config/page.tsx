'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Power, Mail, Phone, Key, MessageSquare, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface LoginConfig {
  provider: string;
  name: string;
  isEnabled: boolean;
}

export default function LoginConfigPage() {
  const [configs, setConfigs] = useState<LoginConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/login-configs');
      if (response.data.success) {
        setConfigs(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (provider: string) => {
    try {
      await api.put(`/system/login-configs/${provider}/toggle`);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to toggle config:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'EMAIL':
        return <Mail className="h-8 w-8 text-blue-500" />;
      case 'PHONE':
        return <Phone className="h-8 w-8 text-green-500" />;
      case 'PASSWORD':
        return <Key className="h-8 w-8 text-gray-500" />;
      case 'WECHAT':
        return <MessageSquare className="h-8 w-8 text-green-600" />;
      case 'DINGTALK':
        return <Send className="h-8 w-8 text-blue-600" />;
      case 'FEISHU':
        return <Send className="h-8 w-8 text-blue-400" />;
      default:
        return <Key className="h-8 w-8 text-gray-400" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'EMAIL':
        return 'Allow users to login with email and password';
      case 'PHONE':
        return 'Allow users to login with phone number and SMS code';
      case 'PASSWORD':
        return 'Traditional username/password authentication';
      case 'WECHAT':
        return 'WeChat OAuth login (微信登录)';
      case 'DINGTALK':
        return 'DingTalk OAuth login (钉钉登录)';
      case 'FEISHU':
        return 'Feishu/Lark OAuth login (飞书登录)';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Login Configuration</h1>
          <p className="text-gray-500">Configure authentication methods</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {configs.filter(c => c.isEnabled).length}
              </p>
              <p className="text-sm text-gray-500">Active Methods</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{configs.length}</p>
              <p className="text-sm text-gray-500">Total Methods</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {configs.filter(c => ['WECHAT', 'DINGTALK', 'FEISHU'].includes(c.provider) && c.isEnabled).length}
              </p>
              <p className="text-sm text-gray-500">OAuth Providers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No authentication methods configured</div>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <div
                  key={config.provider}
                  className={`p-4 border rounded-lg ${
                    config.isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getProviderIcon(config.provider)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{config.name}</h3>
                        <p className="text-sm text-gray-500">
                          {getProviderDescription(config.provider)}
                        </p>
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

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Session Timeout</h4>
              <p className="text-2xl font-bold text-gray-900">7 days</p>
              <p className="text-sm text-gray-500">Auto logout after inactivity</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Password Policy</h4>
              <p className="text-2xl font-bold text-gray-900">Standard</p>
              <p className="text-sm text-gray-500">Minimum 8 characters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

