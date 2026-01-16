'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Save,
  RotateCcw,
  Bot,
  Shield,
  Bell,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { SystemSettings } from '@/types';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getSettings();
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle setting change
  const handleChange = (key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminApi.updateSettings(settings);
      if (response.success) {
        showToast('Settings saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await adminApi.resetSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        showToast('Settings reset to defaults', 'success');
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      showToast('Failed to reset settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-12 w-64" />
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            loading={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-5 w-5 text-gray-500" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Name
              </label>
              <Input
                value={(settings['system.name'] as string) || ''}
                onChange={(e) => handleChange('system.name', e.target.value)}
                placeholder="Master Trainer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Description
              </label>
              <Input
                value={(settings['system.description'] as string) || ''}
                onChange={(e) => handleChange('system.description', e.target.value)}
                placeholder="AI-Powered Sales Training System"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-gray-500" />
              AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default AI Model
              </label>
              <select
                value={(settings['ai.defaultModel'] as string) || 'gpt-4o-mini'}
                onChange={(e) => handleChange('ai.defaultModel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                <option value="qwen-max">Qwen Max</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Dialogue Turns
              </label>
              <Input
                type="number"
                value={(settings['ai.maxDialogueTurns'] as number) || 8}
                onChange={(e) => handleChange('ai.maxDialogueTurns', parseInt(e.target.value))}
                min={1}
                max={20}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (0.0 - 1.0)
              </label>
              <Input
                type="number"
                value={(settings['ai.temperature'] as number) || 0.7}
                onChange={(e) => handleChange('ai.temperature', parseFloat(e.target.value))}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <Input
                type="number"
                value={(settings['ai.maxTokens'] as number) || 2000}
                onChange={(e) => handleChange('ai.maxTokens', parseInt(e.target.value))}
                min={100}
                max={8000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (seconds)
              </label>
              <Input
                type="number"
                value={(settings['ai.timeout'] as number) || 30}
                onChange={(e) => handleChange('ai.timeout', parseInt(e.target.value))}
                min={10}
                max={120}
              />
            </div>
          </CardContent>
        </Card>

        {/* Roleplay Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-gray-500" />
              Roleplay Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Message Length
              </label>
              <Input
                type="number"
                value={(settings['roleplay.minMessageLength'] as number) || 10}
                onChange={(e) => handleChange('roleplay.minMessageLength', parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Message Length
              </label>
              <Input
                type="number"
                value={(settings['roleplay.maxMessageLength'] as number) || 2000}
                onChange={(e) => handleChange('roleplay.maxMessageLength', parseInt(e.target.value))}
                min={100}
                max={10000}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scoring Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              Scoring Weights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value Articulation Weight (%)
              </label>
              <Input
                type="number"
                value={(settings['scoring.valueArticulation'] as number) || 35}
                onChange={(e) => handleChange('scoring.valueArticulation', parseInt(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objection Handling Weight (%)
              </label>
              <Input
                type="number"
                value={(settings['scoring.objectionHandling'] as number) || 35}
                onChange={(e) => handleChange('scoring.objectionHandling', parseInt(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technical Clarity Weight (%)
              </label>
              <Input
                type="number"
                value={(settings['scoring.technicalClarity'] as number) || 30}
                onChange={(e) => handleChange('scoring.technicalClarity', parseInt(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <p className="text-xs text-gray-500">
              Note: Total weights should add up to 100%
            </p>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-gray-500" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">New User Registration</p>
                <p className="text-xs text-gray-500">Notify when a new user registers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings['notification.newUserRegistration'] as boolean) ?? true}
                  onChange={(e) => handleChange('notification.newUserRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Scenario Updates</p>
                <p className="text-xs text-gray-500">Notify when scenarios are modified</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings['notification.scenarioUpdate'] as boolean) ?? true}
                  onChange={(e) => handleChange('notification.scenarioUpdate', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">System Errors</p>
                <p className="text-xs text-gray-500">Notify on system errors</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings['notification.systemError'] as boolean) ?? true}
                  onChange={(e) => handleChange('notification.systemError', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Weekly Report</p>
                <p className="text-xs text-gray-500">Send weekly usage report</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings['notification.weeklyReport'] as boolean) ?? true}
                  onChange={(e) => handleChange('notification.weeklyReport', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Auth Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-gray-500" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <Input
                type="number"
                value={(settings['auth.sessionTimeout'] as number) || 30}
                onChange={(e) => handleChange('auth.sessionTimeout', parseInt(e.target.value))}
                min={5}
                max={1440}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">Allow Registration</p>
                <p className="text-xs text-gray-500">Allow new users to register</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings['auth.allowRegistration'] as boolean) ?? true}
                  onChange={(e) => handleChange('auth.allowRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

