import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Scenario, 
  Session, 
  Feedback, 
  FollowUpEmail, 
  UserStatistics, 
  AdminStatistics, 
  ScenarioListItem,
  AIModel,
  BuyerPersonaTemplate,
  OperationLog,
  SystemSettings,
  UserDetails,
  ExportStatistics,
} from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (name: string, email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
};

/**
 * Scenarios API
 */
export const scenariosApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<ScenarioListItem>>> => {
    const response = await api.get('/scenarios', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Scenario>> => {
    const response = await api.get(`/scenarios/${id}`);
    return response.data;
  },

  getRecommended: async (): Promise<ApiResponse<ScenarioListItem[]>> => {
    const response = await api.get('/scenarios/recommended');
    return response.data;
  },
};

/**
 * Roleplay API
 */
export const roleplayApi = {
  start: async (scenarioId: string): Promise<ApiResponse<Session>> => {
    const response = await api.post('/roleplay/start', { scenarioId });
    return response.data;
  },

  sendMessage: async (sessionId: string, content: string): Promise<ApiResponse<{ userMessage: Message; aiMessage: Message }>> => {
    const response = await api.post('/roleplay/message', { sessionId, content });
    return response.data;
  },

  end: async (sessionId: string): Promise<ApiResponse<Session>> => {
    const response = await api.post('/roleplay/end', { sessionId });
    return response.data;
  },

  getSession: async (sessionId: string): Promise<ApiResponse<Session>> => {
    const response = await api.get(`/roleplay/session/${sessionId}`);
    return response.data;
  },

  getHistory: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Session>>> => {
    const response = await api.get('/roleplay/history', { params });
    return response.data;
  },
};

/**
 * Feedback API
 */
export const feedbackApi = {
  generate: async (sessionId: string): Promise<ApiResponse<Feedback>> => {
    const response = await api.post('/feedback/generate', { sessionId });
    return response.data;
  },

  getBySession: async (sessionId: string): Promise<ApiResponse<Feedback>> => {
    const response = await api.get(`/feedback/${sessionId}`);
    return response.data;
  },
};

/**
 * Email API
 */
export const emailApi = {
  generate: async (sessionId: string): Promise<ApiResponse<FollowUpEmail>> => {
    const response = await api.post('/email/generate', { sessionId });
    return response.data;
  },

  update: async (id: string, data: Partial<FollowUpEmail>): Promise<ApiResponse<FollowUpEmail>> => {
    const response = await api.put(`/email/${id}`, data);
    return response.data;
  },

  getBySession: async (sessionId: string): Promise<ApiResponse<FollowUpEmail>> => {
    const response = await api.get(`/email/${sessionId}`);
    return response.data;
  },
};

/**
 * Statistics API
 */
export const statisticsApi = {
  getUserStats: async (): Promise<ApiResponse<UserStatistics>> => {
    const response = await api.get('/statistics/user');
    return response.data;
  },

  getAdminStats: async (): Promise<ApiResponse<AdminStatistics>> => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },
};

/**
 * Admin API
 */
export const adminApi = {
  // Statistics
  getStatistics: async (): Promise<ApiResponse<AdminStatistics>> => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },

  // Scenarios
  getScenarios: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Scenario>>> => {
    const response = await api.get('/admin/scenarios', { params });
    return response.data;
  },

  createScenario: async (data: Partial<Scenario>): Promise<ApiResponse<Scenario>> => {
    const response = await api.post('/admin/scenarios', data);
    return response.data;
  },

  updateScenario: async (id: string, data: Partial<Scenario>): Promise<ApiResponse<Scenario>> => {
    const response = await api.put(`/admin/scenarios/${id}`, data);
    return response.data;
  },

  deleteScenario: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/scenarios/${id}`);
    return response.data;
  },

  toggleScenarioStatus: async (id: string): Promise<ApiResponse<Scenario>> => {
    const response = await api.put(`/admin/scenarios/${id}/status`);
    return response.data;
  },

  // Users
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    role?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserDetails: async (id: string): Promise<ApiResponse<UserDetails>> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User> & { password?: string }): Promise<ApiResponse<User>> => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // System Settings
  getSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  getSettingsByCategory: async (category: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get(`/admin/settings/${category}`);
    return response.data;
  },

  updateSettings: async (settings: Record<string, unknown>): Promise<ApiResponse<SystemSettings>> => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  resetSettings: async (): Promise<ApiResponse<SystemSettings>> => {
    const response = await api.post('/admin/settings/reset');
    return response.data;
  },

  // Operation Logs
  getOperationLogs: async (params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    operationType?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedResponse<OperationLog>>> => {
    const response = await api.get('/admin/logs', { params });
    return response.data;
  },

  // Buyer Persona Templates
  getPersonaTemplates: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<BuyerPersonaTemplate>>> => {
    const response = await api.get('/admin/personas', { params });
    return response.data;
  },

  createPersonaTemplate: async (data: Partial<BuyerPersonaTemplate>): Promise<ApiResponse<BuyerPersonaTemplate>> => {
    const response = await api.post('/admin/personas', data);
    return response.data;
  },

  updatePersonaTemplate: async (id: string, data: Partial<BuyerPersonaTemplate>): Promise<ApiResponse<BuyerPersonaTemplate>> => {
    const response = await api.put(`/admin/personas/${id}`, data);
    return response.data;
  },

  deletePersonaTemplate: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/personas/${id}`);
    return response.data;
  },

  // AI Models
  getAIModels: async (): Promise<ApiResponse<AIModel[]>> => {
    const response = await api.get('/admin/ai-models');
    return response.data;
  },

  getAvailableAIModels: async (): Promise<ApiResponse<{
    defaultModels: { id: string; name: string; provider: string; description?: string }[];
    customModels: AIModel[];
  }>> => {
    const response = await api.get('/admin/ai-models/available');
    return response.data;
  },

  createAIModel: async (data: {
    modelId: string;
    name: string;
    provider: string;
    description?: string;
    isDefault?: boolean;
    config?: Record<string, unknown>;
  }): Promise<ApiResponse<AIModel>> => {
    const response = await api.post('/admin/ai-models', data);
    return response.data;
  },

  updateAIModel: async (id: string, data: Partial<AIModel>): Promise<ApiResponse<AIModel>> => {
    const response = await api.put(`/admin/ai-models/${id}`, data);
    return response.data;
  },

  deleteAIModel: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/admin/ai-models/${id}`);
    return response.data;
  },

  testAIModel: async (id: string): Promise<ApiResponse<{
    modelId: string;
    modelName: string;
    testResult: boolean;
    responseTime: number;
    message: string;
    error?: string;
  }>> => {
    const response = await api.post(`/admin/ai-models/${id}/test`);
    return response.data;
  },

  testAIModelDirect: async (modelId: string): Promise<ApiResponse<{
    modelId: string;
    testResult: boolean;
    responseTime: number;
    message: string;
    error?: string;
  }>> => {
    const response = await api.post('/admin/ai-models/test-direct', { modelId });
    return response.data;
  },

  // Export
  exportStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    type?: 'all' | 'users' | 'scenarios' | 'sessions';
  }): Promise<ApiResponse<ExportStatistics>> => {
    const response = await api.get('/admin/export/statistics', { params });
    return response.data;
  },
};

// Message type for roleplay
interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

export default api;

