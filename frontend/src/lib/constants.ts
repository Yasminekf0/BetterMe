/**
 * Application Constants
 */

// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Application Name
export const APP_NAME = 'Master Trainer';
export const APP_DESCRIPTION = 'AI Sales Training and Coaching System';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SCENARIOS: '/scenarios',
  SCENARIO_DETAIL: (id: string) => `/scenarios/${id}`,
  ROLEPLAY: (sessionId: string) => `/roleplay/${sessionId}`,
  FEEDBACK: (sessionId: string) => `/feedback/${sessionId}`,
  EMAIL: (sessionId: string) => `/email/${sessionId}`,
  HISTORY: '/history',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_SCENARIOS: '/admin/scenarios',
  ADMIN_SCENARIO_NEW: '/admin/scenarios/new',
  ADMIN_SCENARIO_EDIT: (id: string) => `/admin/scenarios/${id}`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_AI_MODELS: '/admin/ai-models',
  ADMIN_PERSONAS: '/admin/personas',
  ADMIN_LOGS: '/admin/logs',
  // New admin routes
  ADMIN_ARTICLES: '/admin/articles',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_MEMBERSHIP: '/admin/membership',
  ADMIN_PLUGINS: '/admin/plugins',
  ADMIN_MEDIA: '/admin/media',
  ADMIN_ROLES: '/admin/roles',
  ADMIN_LANGUAGES: '/admin/languages',
  ADMIN_PAYMENT: '/admin/payment',
  ADMIN_LOGIN_CONFIG: '/admin/login-config',
  ADMIN_STORAGE: '/admin/storage',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  TRAINER: 'trainer',
  ADMIN: 'admin',
} as const;

// Scenario Difficulties
export const DIFFICULTIES = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
} as const;

// Scenario Categories
export const SCENARIO_CATEGORIES = [
  { id: 'technical', label: 'Technical Solution' },
  { id: 'objections', label: 'Objection Handling' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'competition', label: 'Competition' },
  { id: 'opening', label: 'Opening Conversation' },
  { id: 'pricing', label: 'Pricing & Negotiation' },
] as const;

// Feedback Dimensions
export const FEEDBACK_DIMENSIONS = [
  { id: 'value_articulation', label: 'Value Articulation', weight: 35 },
  { id: 'objection_handling', label: 'Objection Handling', weight: 35 },
  { id: 'technical_clarity', label: 'Technical Clarity', weight: 30 },
] as const;

// Max Dialogue Turns
export const MAX_DIALOGUE_TURNS = 8;

// Message Limits
export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 2000;

// Session Timeout (30 minutes)
export const SESSION_TIMEOUT = 30 * 60 * 1000;

// AI Models Available
export const AI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'qwen-max', label: 'Qwen Max', provider: 'Alibaba' },
  { id: 'qwen-plus', label: 'Qwen Plus', provider: 'Alibaba' },
  { id: 'qwen-turbo', label: 'Qwen Turbo', provider: 'Alibaba' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'DeepSeek' },
  { id: 'deepseek-coder', label: 'DeepSeek Coder', provider: 'DeepSeek' },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

