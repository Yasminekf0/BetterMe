/**
 * User Types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'trainer' | 'user';
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Scenario Types
 */
export interface BuyerPersona {
  name: string;
  role: string;
  company: string;
  background: string;
  concerns: string[];
  personality: string;
  avatar?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  buyerPersona: BuyerPersona;
  objections: string[];
  idealResponses: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isActive: boolean;
  estimatedDuration: number;
  practiceCount: number;
  averageScore: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioListItem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  estimatedDuration: number;
  practiceCount: number;
  averageScore: number;
  myBestScore?: number;
  buyerPersona: {
    name: string;
    role: string;
    company: string;
  };
}

/**
 * Session Types
 */
export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  userId: string;
  scenarioId: string;
  scenario?: Scenario;
  status: 'active' | 'completed' | 'abandoned';
  messages: Message[];
  feedback?: Feedback;
  startedAt: string;
  completedAt?: string;
}

/**
 * Feedback Types
 */
export interface FeedbackDimension {
  name: string;
  score: number;
  weight: number;
  quote: string;
  explanation: string;
  suggestions: string[];
}

export interface Feedback {
  id: string;
  sessionId: string;
  overallScore: number;
  dimensions: FeedbackDimension[];
  summary: string;
  recommendations: string[];
  createdAt: string;
}

/**
 * Email Types
 */
export interface FollowUpEmail {
  id: string;
  sessionId: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statistics Types
 */
export interface UserStatistics {
  totalPractices: number;
  averageScore: number;
  totalDuration: number;
  bestScore: number;
  thisWeekPractices: number;
  thisWeekTarget: number;
  scoreHistory: { date: string; score: number }[];
  scoreByScenario: { scenarioId: string; title: string; score: number }[];
}

export interface AdminStatistics {
  activeUsersToday: number;
  sessionsToday: number;
  activeScenarios: number;
  averageScore: number;
  userGrowth: number;
  sessionGrowth: number;
  totalUsers?: number;
  totalScenarios?: number;
  totalSessions?: number;
  practicesTrend: { date: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  topScenarios: { id: string; title: string; practiceCount: number; avgScore: number }[];
  recentActivity?: { user: string; action: string; scenario: string; time: string }[];
}

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Form Types
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ScenarioFormData {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number;
  buyerPersona: BuyerPersona;
  objections: string[];
  idealResponses: string[];
}

/**
 * AI Model Types
 */
export interface AIModel {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AISettings {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  maxTurns: number;
}

/**
 * Buyer Persona Template Types
 */
export interface BuyerPersonaTemplate {
  id: string;
  name: string;
  role: string;
  company: string;
  background: string;
  concerns: string[];
  personality: string;
  category: string;
  isDefault: boolean;
  isActive: boolean;
  createdById?: string;
  createdBy?: { name: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * Operation Log Types
 */
export interface OperationLog {
  id: string;
  userId: string;
  user: { name: string; email: string };
  operationType: string;
  targetType: string;
  targetId?: string;
  description: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

/**
 * System Settings Types
 */
export interface SystemSettings {
  [key: string]: unknown;
  'system.name'?: string;
  'system.description'?: string;
  'ai.defaultModel'?: string;
  'ai.temperature'?: number;
  'ai.maxTokens'?: number;
  'ai.maxDialogueTurns'?: number;
  'ai.timeout'?: number;
  'roleplay.minMessageLength'?: number;
  'roleplay.maxMessageLength'?: number;
  'scoring.valueArticulation'?: number;
  'scoring.objectionHandling'?: number;
  'scoring.technicalClarity'?: number;
}

/**
 * User Details with Statistics
 */
export interface UserDetails {
  user: User;
  statistics: {
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
    bestScore: number;
    scoreTrend: { score: number; date: string }[];
  };
  recentSessions: {
    id: string;
    scenarioTitle: string;
    scenarioCategory: string;
    score?: number;
    completedAt: string;
  }[];
  topScenarios: {
    scenarioId: string;
    title: string;
    practiceCount: number;
  }[];
}

/**
 * Export Statistics
 */
export interface ExportStatistics {
  exportDate: string;
  dateRange: { start: string; end: string };
  type: string;
  users?: User[];
  scenarios?: Scenario[];
  sessions?: Session[];
}

