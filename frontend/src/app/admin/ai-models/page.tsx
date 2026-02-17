'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
  Settings,
  X,
  Save,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { AIModel } from '@/types';

// Model categories / 模型分类
// Different categories have different API endpoints / 不同分类有不同的API端点
type ModelCategory = 'CHAT' | 'TTS' | 'STT' | 'EMBEDDING' | 'MULTIMODAL';

interface ModelFormData {
  modelId: string;
  name: string;
  provider: string;
  // Model category - determines API endpoint type / 模型分类 - 决定API端点类型
  category: ModelCategory;
  description: string;
  // API Endpoint - API接口地址
  apiEndpoint: string;
  // API Key - API密钥
  apiKey: string;
  isDefault: boolean;
  isActive: boolean;
  config: {
    temperature: number;
    maxTokens: number;
  };
}

interface TestResult {
  modelId: string;
  testResult: boolean;
  responseTime: number;
  message: string;
  error?: string;
}

// Category info with labels and default API endpoints
// 分类信息，包含标签和默认API端点
// NOTE: apiEndpoint should ONLY contain the base URL, NOT the full path
// apiEndpoint 只应包含基础URL，不要包含完整路径
// The endpoint path (e.g., /chat/completions) is appended by backend aiService
// 端点路径（如 /chat/completions）由后端 aiService 自动追加
const CATEGORY_INFO: Record<ModelCategory, { label: string; description: string; defaultEndpoint: string }> = {
  CHAT: { 
    label: 'Chat / 对话', 
    description: 'Text chat models / 文本对话模型',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  TTS: { 
    label: 'TTS / 语音合成', 
    description: 'Text-to-Speech models / 语音合成模型',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/api/v1'
  },
  STT: { 
    label: 'STT / 语音转文字', 
    description: 'Speech-to-Text models / 语音识别模型',
    defaultEndpoint: 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime'
  },
  EMBEDDING: { 
    label: 'Embedding / 向量', 
    description: 'Vector embedding models / 向量嵌入模型',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  MULTIMODAL: { 
    label: 'Multimodal / 多模态', 
    description: 'Multimodal models / 多模态模型',
    defaultEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding'
  },
};

const initialFormData: ModelFormData = {
  modelId: '',
  name: '',
  provider: '',
  category: 'CHAT',
  description: '',
  apiEndpoint: '',
  apiKey: '',
  isDefault: false,
  isActive: true,
  config: {
    temperature: 0.7,
    maxTokens: 2000,
  },
};

export default function AdminAIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModelFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [testingModels, setTestingModels] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const { showToast } = useToast();

  // Fetch AI models
  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAIModels();
      if (response.success && response.data) {
        // API 直接返回数组，而不是 { items: [...] }
        setModels(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch AI models:', error);
      showToast('Failed to load AI models', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Open form for creating new model
  const handleCreate = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(true);
  };

  // Open form for editing model
  // 打开编辑模型表单
  const handleEdit = (model: AIModel) => {
    const config = model.config as { temperature?: number; maxTokens?: number } | undefined;
    // 从模型中读取 apiEndpoint, apiKey, category（如果存在）
    const modelAny = model as AIModel & { apiEndpoint?: string; apiKey?: string; category?: ModelCategory };
    setFormData({
      modelId: model.modelId,
      name: model.name,
      provider: model.provider,
      // 读取分类 / Read category
      category: modelAny.category || 'CHAT',
      description: model.description || '',
      // 读取API配置 / Read API configuration
      apiEndpoint: modelAny.apiEndpoint || '',
      apiKey: '', // API Key 不回显，保持空白让用户重新输入 / Don't echo API Key for security
      isDefault: model.isDefault || false,
      isActive: model.isActive !== false,
      config: config ? {
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens ?? 2000,
      } : { temperature: 0.7, maxTokens: 2000 },
    });
    setEditingId(model.id);
    setShowForm(true);
  };

  // Save model
  // 保存模型
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // 构建保存数据，包含分类和非空的API配置
      // Build save data, include category and non-empty API config
      const saveData = {
        modelId: formData.modelId,
        name: formData.name,
        provider: formData.provider,
        // Include category / 包含分类
        category: formData.category,
        description: formData.description,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        config: formData.config,
        // 只有非空时才传递 apiEndpoint / Only pass apiEndpoint if not empty
        apiEndpoint: formData.apiEndpoint.trim() || undefined,
        // 只有非空时才传递 apiKey（编辑时留空表示不更改）
        // Only pass apiKey if not empty (empty means keep current when editing)
        apiKey: formData.apiKey.trim() || undefined,
      };
      
      if (editingId) {
        await adminApi.updateAIModel(editingId, saveData);
        showToast('AI model updated successfully / AI模型更新成功', 'success');
      } else {
        await adminApi.createAIModel(saveData);
        showToast('AI model created successfully / AI模型创建成功', 'success');
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      fetchModels();
    } catch (error) {
      console.error('Failed to save AI model:', error);
      showToast('Failed to save AI model / 保存AI模型失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete model
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI model?')) {
      return;
    }

    try {
      await adminApi.deleteAIModel(id);
      showToast('AI model deleted successfully', 'success');
      fetchModels();
    } catch (error) {
      console.error('Failed to delete AI model:', error);
      showToast('Failed to delete AI model', 'error');
    }
  };

  // Toggle model status
  const handleToggleStatus = async (model: AIModel) => {
    try {
      await adminApi.updateAIModel(model.id, { 
        isActive: !model.isActive 
      });
      showToast(`AI model ${model.isActive ? 'disabled' : 'enabled'} successfully`, 'success');
      fetchModels();
    } catch (error) {
      console.error('Failed to toggle AI model status:', error);
      showToast('Failed to update AI model', 'error');
    }
  };

  // Set as default
  const handleSetDefault = async (model: AIModel) => {
    try {
      await adminApi.updateAIModel(model.id, { isDefault: true });
      showToast(`${model.name} set as default model`, 'success');
      fetchModels();
    } catch (error) {
      console.error('Failed to set default model:', error);
      showToast('Failed to set default model', 'error');
    }
  };

  // Test AI model connection
  const handleTestModel = async (model: AIModel) => {
    try {
      setTestingModels((prev) => ({ ...prev, [model.id]: true }));
      setTestResults((prev) => {
        const newResults = { ...prev };
        delete newResults[model.id];
        return newResults;
      });
      const response = await adminApi.testAIModel(model.id);
      if (response.success && response.data) {
        const data = response.data;
        setTestResults((prev) => ({
          ...prev,
          [model.id]: {
            modelId: data.modelId,
            testResult: data.testResult,
            responseTime: data.responseTime,
            message: data.message,
            error: data.error,
          },
        }));
        if (data.testResult) {
          showToast(`${model.name} connection test successful (${data.responseTime}ms)`, 'success');
        } else {
          showToast(`${model.name} connection test failed: ${data.error || data.message}`, 'error');
        }
      }
    } catch (error) {
      console.error('Failed to test AI model:', error);
      showToast('Failed to test AI model connection', 'error');
      setTestResults((prev) => ({
        ...prev,
        [model.id]: {
          modelId: model.modelId,
          testResult: false,
          responseTime: 0,
          message: 'Test failed',
          error: 'Failed to connect to AI service',
        },
      }));
    } finally {
      setTestingModels((prev) => ({ ...prev, [model.id]: false }));
    }
  };

  // Get provider badge color
  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'bg-green-100 text-green-700';
      case 'anthropic':
        return 'bg-orange-100 text-orange-700';
      case 'alibaba':
        return 'bg-blue-100 text-blue-700';
      case 'deepseek':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get category badge color / 获取分类徽章颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'CHAT':
        return 'bg-indigo-100 text-indigo-700';
      case 'TTS':
        return 'bg-pink-100 text-pink-700';
      case 'STT':
        return 'bg-cyan-100 text-cyan-700';
      case 'EMBEDDING':
        return 'bg-amber-100 text-amber-700';
      case 'MULTIMODAL':
        return 'bg-violet-100 text-violet-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get category label / 获取分类标签
  const getCategoryLabel = (category: string) => {
    return CATEGORY_INFO[category as ModelCategory]?.label || category;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-12 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Model Management</h1>
          <p className="text-gray-500 mt-1">
            Configure and manage AI models for roleplay and feedback
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      {/* Model Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Card key={model.id} className={model.isActive === false ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary-500" />
                    {model.name}
                    {model.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{model.modelId}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderColor(model.provider)}`}>
                    {model.provider}
                  </span>
                  {/* Category badge / 分类徽章 */}
                  {(model as AIModel & { category?: string }).category && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor((model as AIModel & { category?: string }).category || 'CHAT')}`}>
                      {getCategoryLabel((model as AIModel & { category?: string }).category || 'CHAT')}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {model.description || 'No description provided'}
              </p>

              {/* Config Info */}
              {model.config && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span>Temp: {(model.config as { temperature?: number })?.temperature ?? 'N/A'}</span>
                  <span>Tokens: {(model.config as { maxTokens?: number })?.maxTokens ?? 'N/A'}</span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Status:</span>
                {model.isActive !== false ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>

              {/* Test Result Display */}
              {testResults[model.id] && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  testResults[model.id].testResult 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResults[model.id].testResult ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={testResults[model.id].testResult ? 'text-green-700' : 'text-red-700'}>
                      {testResults[model.id].message}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Response time: {testResults[model.id].responseTime}ms</span>
                  </div>
                  {testResults[model.id].error && (
                    <p className="mt-1 text-xs text-red-600">
                      {testResults[model.id].error}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(model)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestModel(model)}
                  disabled={testingModels[model.id]}
                  title="Test connection"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {testingModels[model.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(model)}
                >
                  {model.isActive !== false ? (
                    <ToggleRight className="h-4 w-4 text-success-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
                {!model.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(model)}
                    title="Set as default"
                  >
                    <Star className="h-4 w-4 text-gray-400 hover:text-yellow-500" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(model.id)}
                >
                  <Trash2 className="h-4 w-4 text-error-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Edit AI Model' : 'Add AI Model'}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model ID *
                </label>
                <Input
                  value={formData.modelId}
                  onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  placeholder="e.g., gpt-4o-mini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., GPT-4o Mini"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider *
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select provider</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Alibaba">Alibaba</option>
                  <option value="DeepSeek">DeepSeek</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Category - 模型分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category / 分类 *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const newCategory = e.target.value as ModelCategory;
                    setFormData({ 
                      ...formData, 
                      category: newCategory,
                      // Auto-fill API endpoint based on category / 根据分类自动填充API端点
                      apiEndpoint: formData.apiEndpoint || CATEGORY_INFO[newCategory].defaultEndpoint,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {(Object.keys(CATEGORY_INFO) as ModelCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_INFO[cat].label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {CATEGORY_INFO[formData.category].description}
                </p>
              </div>

              {/* API Endpoint - API接口地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint
                  <span className="text-gray-400 font-normal ml-1">(可选 / Optional)</span>
                </label>
                <Input
                  value={formData.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  placeholder="e.g., https://api.openai.com/v1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  留空则使用系统默认配置 / Leave empty to use system default
                </p>
              </div>

              {/* API Key - API密钥 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                  <span className="text-gray-400 font-normal ml-1">(可选 / Optional)</span>
                </label>
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={editingId ? "输入新密钥或留空保持不变" : "e.g., sk-xxxxxxxxxxxxxxxx"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingId 
                    ? "编辑时留空表示不更改 / Leave empty to keep current key" 
                    : "留空则使用系统默认配置 / Leave empty to use system default"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the model capabilities..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature
                  </label>
                  <Input
                    type="number"
                    value={formData.config.temperature}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, temperature: parseFloat(e.target.value) }
                    })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Tokens
                  </label>
                  <Input
                    type="number"
                    value={formData.config.maxTokens}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, maxTokens: parseInt(e.target.value) }
                    })}
                    min={100}
                    max={32000}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Set as Default</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!formData.modelId || !formData.name || !formData.provider}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

