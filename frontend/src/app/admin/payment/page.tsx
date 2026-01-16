'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Power, CreditCard, Smartphone, Globe, Wallet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface PaymentConfig {
  provider: string;
  name: string;
  isEnabled: boolean;
  isSandbox: boolean;
}

export default function PaymentPage() {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/payment-configs');
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
      await api.put(`/system/payment-configs/${provider}/toggle`);
      fetchConfigs();
    } catch (error) {
      console.error('Failed to toggle config:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'WECHAT':
        return <Smartphone className="h-8 w-8 text-green-500" />;
      case 'ALIPAY':
        return <Wallet className="h-8 w-8 text-blue-500" />;
      case 'PAYPAL':
        return <Globe className="h-8 w-8 text-blue-700" />;
      case 'STRIPE':
        return <CreditCard className="h-8 w-8 text-purple-500" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-400" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'WECHAT':
        return 'Accept payments via WeChat Pay (微信支付)';
      case 'ALIPAY':
        return 'Accept payments via Alipay (支付宝)';
      case 'PAYPAL':
        return 'Accept international payments via PayPal';
      case 'STRIPE':
        return 'Accept credit card payments via Stripe';
      case 'EPAY':
        return 'Accept payments via EPay gateway';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-500">Configure payment gateways</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No payment providers configured</div>
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{config.name}</h3>
                          {config.isSandbox && (
                            <Badge variant="warning">Sandbox</Badge>
                          )}
                        </div>
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
          <CardTitle>Payment Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Default Currency</h4>
              <p className="text-2xl font-bold text-blue-600">USD</p>
              <p className="text-sm text-gray-500">United States Dollar</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Tax Rate</h4>
              <p className="text-2xl font-bold text-gray-900">0%</p>
              <p className="text-sm text-gray-500">No tax applied</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

