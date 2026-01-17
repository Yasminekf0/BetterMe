import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed the database with initial data
 */
async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mastertrainer.com' },
    update: {},
    create: {
      email: 'admin@mastertrainer.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      department: 'Administration',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create trainer user
  const trainerPassword = await bcrypt.hash('trainer123', 12);
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@mastertrainer.com' },
    update: {},
    create: {
      email: 'trainer@mastertrainer.com',
      password: trainerPassword,
      name: 'Training Manager',
      role: 'TRAINER',
      department: 'Sales Enablement',
    },
  });
  console.log('✅ Trainer user created:', trainer.email);

  // Create demo user
  const userPassword = await bcrypt.hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@mastertrainer.com' },
    update: {},
    create: {
      email: 'demo@mastertrainer.com',
      password: userPassword,
      name: 'Demo User',
      role: 'USER',
      department: 'Sales',
    },
  });
  console.log('✅ Demo user created:', demoUser.email);

  // Create sample scenarios
  const scenarios = [
    {
      title: 'Cloud Migration Discussion',
      description: 'Discuss cloud migration options with a CTO who is currently using AWS. Address concerns about data security, migration costs, and technical support.',
      category: 'Technical Solution',
      difficulty: 'MEDIUM' as const,
      estimatedDuration: 15,
      buyerPersona: {
        name: 'Michael Li',
        role: 'CTO',
        company: 'FinTech Innovations Inc.',
        background: '15 years IT experience, currently using AWS for 3 years. Looking to optimize costs and explore alternatives.',
        concerns: ['Data compliance', 'Migration cost', 'Technical support', 'Downtime risk'],
        personality: 'Direct, data-driven, skeptical of new solutions. Values technical depth and concrete examples.',
      },
      objections: [
        'Why should we migrate from AWS? We are already invested in their ecosystem.',
        'What about data compliance for financial services?',
        'How do you ensure zero downtime during migration?',
        'What makes your technical support better than AWS?',
      ],
      idealResponses: [
        'Highlight APAC data center coverage and lower latency for regional customers.',
        'Mention financial industry certifications: PCI DSS, ISO 27001, Level 3 protection.',
        'Explain phased migration approach with hybrid cloud options.',
        'Emphasize 24/7 dedicated support with 15-minute response SLA for enterprise customers.',
      ],
      maxTurns: 8,
      openingPrompt: 'Introduce yourself as the CTO evaluating cloud options. Express interest but also skepticism about changing providers.',
    },
    {
      title: 'Price Objection Handling',
      description: 'Handle price objections from a procurement manager who is comparing quotes from multiple cloud providers.',
      category: 'Objection Handling',
      difficulty: 'HARD' as const,
      estimatedDuration: 12,
      buyerPersona: {
        name: 'Sarah Chen',
        role: 'Procurement Manager',
        company: 'Global Manufacturing Corp.',
        background: '10 years procurement experience. Under pressure to reduce IT costs by 20%.',
        concerns: ['Total cost of ownership', 'Hidden fees', 'Long-term pricing guarantees', 'Volume discounts'],
        personality: 'Numbers-focused, aggressive negotiator. Appreciates transparency and flexibility.',
      },
      objections: [
        'Your quote is 30% higher than competitor X.',
        'What hidden costs should we expect?',
        'Can you guarantee prices for 3 years?',
        'What volume discounts can you offer?',
      ],
      idealResponses: [
        'Focus on TCO analysis including egress fees, support costs, and productivity gains.',
        'Provide transparent pricing breakdown with no hidden fees guarantee.',
        'Discuss reserved instance pricing and enterprise agreements.',
        'Present tiered pricing structure with custom enterprise discounts.',
      ],
      maxTurns: 6,
      openingPrompt: 'Start by saying you have quotes from three vendors and asking about pricing flexibility.',
    },
    {
      title: 'Data Security Compliance',
      description: 'Address security and compliance questions from a Compliance Director at a healthcare company.',
      category: 'Compliance',
      difficulty: 'MEDIUM' as const,
      estimatedDuration: 15,
      buyerPersona: {
        name: 'Dr. Jennifer Wong',
        role: 'Chief Compliance Officer',
        company: 'HealthFirst Medical Group',
        background: 'Former healthcare IT auditor. Responsible for HIPAA compliance and data protection.',
        concerns: ['HIPAA compliance', 'Data residency', 'Encryption standards', 'Audit trails'],
        personality: 'Detail-oriented, risk-averse. Requires documentation and specific certifications.',
      },
      objections: [
        'How do you ensure HIPAA compliance?',
        'Can patient data stay within specific geographic regions?',
        'What encryption standards do you use?',
        'How do you handle security breaches?',
      ],
      idealResponses: [
        'Detail HIPAA compliance certifications and BAA signing process.',
        'Explain data residency options with specific regional data centers.',
        'Describe AES-256 encryption for data at rest and TLS 1.3 for data in transit.',
        'Present incident response procedures and breach notification timelines.',
      ],
      maxTurns: 8,
      openingPrompt: 'Introduce yourself as responsible for ensuring all vendors meet strict healthcare compliance requirements.',
    },
    {
      title: 'Competitor Comparison',
      description: 'Address questions when the customer is comparing your solution with a major competitor.',
      category: 'Competition',
      difficulty: 'HARD' as const,
      estimatedDuration: 12,
      buyerPersona: {
        name: 'David Park',
        role: 'VP of Engineering',
        company: 'TechStart Solutions',
        background: 'Former Google engineer. Tech-savvy and well-informed about cloud technologies.',
        concerns: ['Technical capabilities', 'Innovation pace', 'Developer experience', 'Global reach'],
        personality: 'Tech-focused, challenges claims with technical questions. Respects honest answers.',
      },
      objections: [
        'AWS has a much larger ecosystem. How do you compete?',
        'What unique features do you offer that others do not?',
        'How is your developer experience compared to competitors?',
        'What is your roadmap for AI/ML services?',
      ],
      idealResponses: [
        'Focus on specific strengths rather than trying to match everything.',
        'Highlight unique differentiators like regional coverage or specific industry solutions.',
        'Discuss developer tools, SDKs, and documentation quality.',
        'Present AI/ML roadmap including integration with proprietary models.',
      ],
      maxTurns: 8,
      openingPrompt: 'Start by saying you are evaluating multiple cloud providers and want honest comparison.',
    },
    {
      title: 'New Customer Introduction',
      description: 'Introduction call with a potential customer who is exploring cloud options for the first time.',
      category: 'Opening Conversation',
      difficulty: 'EASY' as const,
      estimatedDuration: 10,
      buyerPersona: {
        name: 'Lisa Martinez',
        role: 'IT Director',
        company: 'RetailMax Stores',
        background: 'Running on-premise infrastructure for 10 years. New to cloud technology.',
        concerns: ['Cloud basics', 'Migration complexity', 'Staff training', 'Business continuity'],
        personality: 'Open-minded but cautious. Appreciates patient explanations without jargon.',
      },
      objections: [
        'We have never used cloud before. Is it reliable?',
        'How difficult is the migration process?',
        'Will my team need extensive retraining?',
        'What happens if internet connectivity fails?',
      ],
      idealResponses: [
        'Explain cloud reliability with SLA guarantees and redundancy.',
        'Describe gradual migration approach starting with non-critical workloads.',
        'Highlight training resources, documentation, and support programs.',
        'Discuss hybrid options and offline capabilities for edge cases.',
      ],
      maxTurns: 6,
      openingPrompt: 'Start by explaining you are new to cloud and want to understand the basics.',
    },
  ];

  for (const scenarioData of scenarios) {
    const scenario = await prisma.scenario.upsert({
      where: { 
        id: scenarioData.title.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {},
      create: {
        ...scenarioData,
        isActive: true,
        practiceCount: Math.floor(Math.random() * 200) + 50,
        averageScore: Math.floor(Math.random() * 20) + 65,
        createdById: trainer.id,
      },
    });
    console.log('✅ Scenario created:', scenario.title);
  }

  // Create default AI models in database
  // AI模型分类: CHAT (对话), TTS (语音合成), STT (语音转文字), EMBEDDING (向量), MULTIMODAL (多模态)
  // Different categories have different API endpoints / 不同分类有不同的API端点
  // API Doc: https://help.aliyun.com/zh/model-studio/
  // NOTE: apiEndpoint should ONLY contain the base URL, NOT the full path
  // The endpoint path (e.g., /chat/completions) is appended by aiService
  // apiEndpoint 只应包含基础URL，不要包含完整路径
  // 端点路径（如 /chat/completions）由 aiService 自动追加
  
  // 阿里云DashScope API Key / Alibaba DashScope API Key
  const DASHSCOPE_API_KEY = 'sk-52389248f75444f4bf0f37f5afff799d';
  
  const aiModels = [
    // ==================== Chat Models / 对话模型 ====================
    // Base URL for chat models (endpoint: /chat/completions)
    // 对话模型基础URL（端点：/chat/completions）
    { 
      modelId: 'qwen3-max', 
      name: 'Qwen3 Max', 
      provider: 'Alibaba', 
      category: 'CHAT' as const,
      isDefault: true, 
      description: 'Alibaba\'s most capable Qwen3 model / 阿里云最强大的Qwen3模型',
      apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: {} 
    },
    { 
      modelId: 'qwen-max', 
      name: 'Qwen Max', 
      provider: 'Alibaba', 
      category: 'CHAT' as const,
      description: 'Alibaba\'s capable model / 阿里云通义千问',
      apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: {} 
    },
    { 
      modelId: 'qwen-plus', 
      name: 'Qwen Plus', 
      provider: 'Alibaba', 
      category: 'CHAT' as const,
      description: 'Enhanced Qwen model / 增强版通义千问',
      apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: {} 
    },
    { 
      modelId: 'qwen-turbo', 
      name: 'Qwen Turbo', 
      provider: 'Alibaba', 
      category: 'CHAT' as const,
      description: 'Fast Qwen model / 快速版通义千问',
      apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: {} 
    },
    { 
      modelId: 'deepseek-chat', 
      name: 'DeepSeek Chat', 
      provider: 'DeepSeek', 
      category: 'CHAT' as const,
      description: 'General chat model',
      apiEndpoint: 'https://api.deepseek.com/v1',
      config: {} 
    },
    { 
      modelId: 'gpt-4o', 
      name: 'GPT-4o', 
      provider: 'OpenAI', 
      category: 'CHAT' as const,
      description: 'Most capable GPT-4 model with vision',
      apiEndpoint: 'https://api.openai.com/v1',
      config: {} 
    },
    { 
      modelId: 'gpt-4o-mini', 
      name: 'GPT-4o Mini', 
      provider: 'OpenAI', 
      category: 'CHAT' as const,
      description: 'Smaller, faster, cost-effective GPT-4 model',
      apiEndpoint: 'https://api.openai.com/v1',
      config: {} 
    },
    
    // ==================== STT Models (Speech to Text / ASR) / 语音转文字模型 ====================
    // STT uses WebSocket endpoint directly (no path appended)
    // STT使用WebSocket端点（不追加路径）
    { 
      modelId: 'qwen3-asr-flash-realtime', 
      name: 'Qwen3 ASR Flash Realtime', 
      provider: 'Alibaba', 
      category: 'STT' as const,
      description: 'Real-time speech to text, low latency / 实时语音转文字，低延迟',
      apiEndpoint: 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime',
      apiKey: DASHSCOPE_API_KEY,
      config: { format: 'pcm', sampleRate: 16000 } 
    },
    { 
      modelId: 'qwen2.5-asr-turbo-realtime', 
      name: 'Qwen2.5 ASR Turbo Realtime', 
      provider: 'Alibaba', 
      category: 'STT' as const,
      description: 'Fast speech to text / 快速语音转文字',
      apiEndpoint: 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime',
      apiKey: DASHSCOPE_API_KEY,
      config: { format: 'pcm', sampleRate: 16000 } 
    },
    
    // ==================== TTS Models (Text to Speech) / 语音合成模型 ====================
    // Aliyun native TTS API (not OpenAI compatible) / 阿里云原生TTS API（非OpenAI兼容）
    // Full endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/generation
    { 
      modelId: 'cosyvoice-v1', 
      name: 'CosyVoice V1', 
      provider: 'Alibaba', 
      category: 'TTS' as const,
      description: 'High quality TTS / 高质量语音合成',
      apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: { voice: 'longxiaochun', format: 'mp3' } 
    },
    { 
      modelId: 'sambert-zhichu-v1', 
      name: 'Sambert 知楚', 
      provider: 'Alibaba', 
      category: 'TTS' as const,
      description: 'Chinese TTS / 中文语音合成',
      apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: { voice: 'zhichu', format: 'mp3' } 
    },
    
    // ==================== Embedding Models / 向量嵌入模型 ====================
    // Base URL for embedding models (endpoint: /embeddings)
    // 向量模型基础URL（端点：/embeddings）
    { 
      modelId: 'text-embedding-v3', 
      name: 'Text Embedding V3', 
      provider: 'Alibaba', 
      category: 'EMBEDDING' as const,
      description: 'Latest text embedding model / 最新版文本向量模型',
      apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: { dimension: 1024 } 
    },
    { 
      modelId: 'text-embedding-v2', 
      name: 'Text Embedding V2', 
      provider: 'Alibaba', 
      category: 'EMBEDDING' as const,
      description: 'Text embedding model V2 / 文本向量模型V2',
      apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: DASHSCOPE_API_KEY,
      config: { dimension: 1536 } 
    },
    
    // ==================== Multimodal Models / 多模态模型 ====================
    // Multimodal uses full API path (specific API format)
    // 多模态使用完整API路径（特定API格式）
    { 
      modelId: 'qwen2.5-vl-embedding', 
      name: 'Qwen2.5 VL Embedding', 
      provider: 'Alibaba', 
      category: 'MULTIMODAL' as const,
      description: 'Multimodal embedding for text and images / 文本和图像多模态向量',
      apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding',
      apiKey: DASHSCOPE_API_KEY,
      config: { supportedTypes: ['text', 'image'] } 
    },
  ];

  for (const model of aiModels) {
    await prisma.aIModel.upsert({
      where: { modelId: model.modelId },
      // Update existing models with new category, apiEndpoint and apiKey / 更新现有模型的分类、API端点和API密钥
      update: {
        name: model.name,
        provider: model.provider,
        category: model.category,
        description: model.description,
        apiEndpoint: model.apiEndpoint,
        // Update API Key if provided / 如果提供则更新API密钥
        ...(model.apiKey && { apiKey: model.apiKey }),
        config: model.config,
      },
      create: {
        ...model,
        isActive: true,
      },
    });
    console.log('✅ AI Model added:', model.name);
  }

  // Create default buyer persona templates
  const personaTemplates = [
    {
      name: 'Technical Decision Maker',
      role: 'CTO',
      company: 'Mid-size Technology Company',
      background: '15+ years in IT leadership. Deep technical expertise. Responsible for technology strategy and vendor selection.',
      concerns: ['Technical feasibility', 'System performance', 'Security compliance', 'Integration complexity'],
      personality: 'Direct, data-driven, skeptical of marketing claims. Values technical depth and concrete examples.',
      category: 'Technical',
      isDefault: true,
    },
    {
      name: 'Compliance Expert',
      role: 'Chief Compliance Officer',
      company: 'Financial Services Firm',
      background: 'Former auditor with deep regulatory knowledge. Responsible for ensuring all vendors meet compliance standards.',
      concerns: ['Regulatory compliance', 'Data protection', 'Audit trails', 'Risk management'],
      personality: 'Detail-oriented, risk-averse. Requires documentation and specific certifications before approving.',
      category: 'Compliance',
      isDefault: true,
    },
    {
      name: 'Procurement Lead',
      role: 'Procurement Manager',
      company: 'Large Enterprise',
      background: '10+ years in procurement. Expert negotiator. Measured on cost reduction and vendor management.',
      concerns: ['Total cost of ownership', 'Contract terms', 'Volume discounts', 'Long-term pricing'],
      personality: 'Numbers-focused, aggressive negotiator. Appreciates transparency and creative pricing models.',
      category: 'Procurement',
      isDefault: true,
    },
    {
      name: 'Business Leader',
      role: 'VP of Operations',
      company: 'Growth-stage Company',
      background: 'MBA with focus on operations. Driving digital transformation initiative. Reports to CEO.',
      concerns: ['Business outcomes', 'Competitive advantage', 'Implementation timeline', 'ROI'],
      personality: 'Results-oriented, time-conscious. Wants clear business value and quick implementation.',
      category: 'Business',
      isDefault: true,
    },
    {
      name: 'IT Director',
      role: 'IT Director',
      company: 'Traditional Enterprise',
      background: 'Managing on-premise infrastructure for years. New to cloud technologies. Cautious about change.',
      concerns: ['Migration complexity', 'Team training', 'Business continuity', 'Vendor support'],
      personality: 'Open-minded but cautious. Appreciates patient explanations without jargon.',
      category: 'Technical',
      isDefault: true,
    },
  ];

  for (const template of personaTemplates) {
    // Check if exists by name and role
    const existing = await prisma.buyerPersonaTemplate.findFirst({
      where: { name: template.name, role: template.role },
    });

    if (!existing) {
      await prisma.buyerPersonaTemplate.create({
        data: {
          ...template,
          isActive: true,
          createdById: admin.id,
        },
      });
      console.log('✅ Persona template created:', template.name);
    }
  }

  // Initialize default system settings
  const defaultSettings = [
    { key: 'system.name', value: 'Master Trainer' },
    { key: 'system.description', value: 'AI-Powered Sales Training System' },
    { key: 'ai.defaultModel', value: 'gpt-4o-mini' },
    { key: 'ai.maxDialogueTurns', value: 8 },
    { key: 'ai.temperature', value: 0.7 },
    { key: 'ai.maxTokens', value: 2000 },
    { key: 'ai.timeout', value: 30 },
    { key: 'roleplay.minMessageLength', value: 10 },
    { key: 'roleplay.maxMessageLength', value: 2000 },
    { key: 'scoring.valueArticulation', value: 35 },
    { key: 'scoring.objectionHandling', value: 35 },
    { key: 'scoring.technicalClarity', value: 30 },
    { key: 'auth.sessionTimeout', value: 30 },
    { key: 'auth.allowRegistration', value: true },
    { key: 'notification.newUserRegistration', value: true },
    { key: 'notification.scenarioUpdate', value: true },
    { key: 'notification.systemError', value: true },
    { key: 'notification.weeklyReport', value: true },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }
  console.log('✅ System settings initialized');

  // Initialize default languages
  const defaultLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', isDefault: true, sortOrder: 0 },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', isDefault: false, sortOrder: 1 },
  ];

  for (const lang of defaultLanguages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: { ...lang, isEnabled: true },
    });
  }
  console.log('✅ Languages initialized');

  // Initialize default roles
  const defaultRoles = [
    { name: 'super_admin', displayName: 'Super Administrator', description: 'Full system access', isSystem: true,
      permissions: ['dashboard.view', 'users.view', 'users.create', 'users.edit', 'users.delete', 'scenarios.view', 'scenarios.create', 'scenarios.edit', 'scenarios.delete', 'articles.view', 'articles.create', 'articles.edit', 'articles.delete', 'notifications.view', 'notifications.send', 'orders.view', 'orders.manage', 'media.view', 'media.upload', 'media.delete', 'plugins.view', 'plugins.manage', 'settings.view', 'settings.edit', 'roles.view', 'roles.manage', 'logs.view'] },
    { name: 'admin', displayName: 'Administrator', description: 'Administrative access', isSystem: true,
      permissions: ['dashboard.view', 'users.view', 'users.create', 'users.edit', 'scenarios.view', 'scenarios.create', 'scenarios.edit', 'scenarios.delete', 'articles.view', 'articles.create', 'articles.edit', 'articles.delete', 'notifications.view', 'notifications.send', 'orders.view', 'orders.manage', 'media.view', 'media.upload', 'media.delete', 'plugins.view', 'plugins.manage', 'settings.view', 'settings.edit', 'logs.view'] },
    { name: 'trainer', displayName: 'Trainer', description: 'Trainer access', isSystem: true,
      permissions: ['dashboard.view', 'users.view', 'scenarios.view', 'scenarios.create', 'scenarios.edit', 'articles.view', 'notifications.view', 'media.view', 'media.upload'] },
    { name: 'user', displayName: 'User', description: 'Basic user access', isSystem: true,
      permissions: ['dashboard.view'] },
  ];

  for (const role of defaultRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles initialized');

  // Initialize default permissions
  const defaultPermissions = [
    { key: 'dashboard.view', name: 'View Dashboard', module: 'dashboard', sortOrder: 0 },
    { key: 'users.view', name: 'View Users', module: 'users', sortOrder: 1 },
    { key: 'users.create', name: 'Create Users', module: 'users', sortOrder: 2 },
    { key: 'users.edit', name: 'Edit Users', module: 'users', sortOrder: 3 },
    { key: 'users.delete', name: 'Delete Users', module: 'users', sortOrder: 4 },
    { key: 'scenarios.view', name: 'View Scenarios', module: 'scenarios', sortOrder: 5 },
    { key: 'scenarios.create', name: 'Create Scenarios', module: 'scenarios', sortOrder: 6 },
    { key: 'scenarios.edit', name: 'Edit Scenarios', module: 'scenarios', sortOrder: 7 },
    { key: 'scenarios.delete', name: 'Delete Scenarios', module: 'scenarios', sortOrder: 8 },
    { key: 'articles.view', name: 'View Articles', module: 'articles', sortOrder: 9 },
    { key: 'articles.create', name: 'Create Articles', module: 'articles', sortOrder: 10 },
    { key: 'articles.edit', name: 'Edit Articles', module: 'articles', sortOrder: 11 },
    { key: 'articles.delete', name: 'Delete Articles', module: 'articles', sortOrder: 12 },
    { key: 'notifications.view', name: 'View Notifications', module: 'notifications', sortOrder: 13 },
    { key: 'notifications.send', name: 'Send Notifications', module: 'notifications', sortOrder: 14 },
    { key: 'orders.view', name: 'View Orders', module: 'orders', sortOrder: 15 },
    { key: 'orders.manage', name: 'Manage Orders', module: 'orders', sortOrder: 16 },
    { key: 'media.view', name: 'View Media', module: 'media', sortOrder: 17 },
    { key: 'media.upload', name: 'Upload Media', module: 'media', sortOrder: 18 },
    { key: 'media.delete', name: 'Delete Media', module: 'media', sortOrder: 19 },
    { key: 'plugins.view', name: 'View Plugins', module: 'plugins', sortOrder: 20 },
    { key: 'plugins.manage', name: 'Manage Plugins', module: 'plugins', sortOrder: 21 },
    { key: 'settings.view', name: 'View Settings', module: 'settings', sortOrder: 22 },
    { key: 'settings.edit', name: 'Edit Settings', module: 'settings', sortOrder: 23 },
    { key: 'roles.view', name: 'View Roles', module: 'roles', sortOrder: 24 },
    { key: 'roles.manage', name: 'Manage Roles', module: 'roles', sortOrder: 25 },
    { key: 'logs.view', name: 'View Logs', module: 'logs', sortOrder: 26 },
  ];

  for (const perm of defaultPermissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }
  console.log('✅ Permissions initialized');

  // Initialize default storage configs
  const defaultStorageConfigs = [
    { type: 'LOCAL' as const, name: 'Local Storage', isEnabled: true, isDefault: true, maxFileSize: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'] },
    { type: 'ALIYUN_OSS' as const, name: 'Aliyun OSS', isEnabled: false, isDefault: false, maxFileSize: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'] },
    { type: 'AWS_S3' as const, name: 'AWS S3', isEnabled: false, isDefault: false, maxFileSize: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'] },
  ];

  for (const config of defaultStorageConfigs) {
    await prisma.storageConfig.upsert({
      where: { type: config.type },
      update: {},
      create: config,
    });
  }
  console.log('✅ Storage configs initialized');

  // Initialize default login configs
  const defaultLoginConfigs = [
    { provider: 'WECHAT' as const, name: 'WeChat', isEnabled: false, sortOrder: 0 },
    { provider: 'DINGTALK' as const, name: 'DingTalk', isEnabled: false, sortOrder: 1 },
    { provider: 'FEISHU' as const, name: 'Feishu', isEnabled: false, sortOrder: 2 },
    { provider: 'GOOGLE' as const, name: 'Google', isEnabled: false, sortOrder: 3 },
    { provider: 'GITHUB' as const, name: 'GitHub', isEnabled: false, sortOrder: 4 },
  ];

  for (const config of defaultLoginConfigs) {
    await prisma.loginConfig.upsert({
      where: { provider: config.provider },
      update: {},
      create: config,
    });
  }
  console.log('✅ Login configs initialized');

  // Initialize default payment configs
  const defaultPaymentConfigs = [
    { provider: 'WECHAT' as const, name: 'WeChat Pay', isEnabled: false, isSandbox: true, sortOrder: 0 },
    { provider: 'ALIPAY' as const, name: 'Alipay', isEnabled: false, isSandbox: true, sortOrder: 1 },
    { provider: 'PAYPAL' as const, name: 'PayPal', isEnabled: false, isSandbox: true, sortOrder: 2 },
    { provider: 'STRIPE' as const, name: 'Stripe', isEnabled: false, isSandbox: true, sortOrder: 3 },
    { provider: 'EPAY' as const, name: 'EPay', isEnabled: false, isSandbox: true, sortOrder: 4 },
  ];

  for (const config of defaultPaymentConfigs) {
    await prisma.paymentConfig.upsert({
      where: { provider: config.provider },
      update: {},
      create: config,
    });
  }
  console.log('✅ Payment configs initialized');

  // Initialize default membership plans
  const defaultMembershipPlans = [
    { name: 'Free', slug: 'free', description: 'Basic access to training scenarios', price: 0, duration: 365, features: { scenarios: 5, practicePerDay: 3, feedback: true }, sortOrder: 0 },
    { name: 'Pro', slug: 'pro', description: 'Full access to all features', price: 29.99, originalPrice: 49.99, duration: 30, features: { scenarios: -1, practicePerDay: -1, feedback: true, analytics: true, priority_support: true }, isFeatured: true, sortOrder: 1 },
    { name: 'Enterprise', slug: 'enterprise', description: 'Team plans with advanced features', price: 99.99, duration: 30, features: { scenarios: -1, practicePerDay: -1, feedback: true, analytics: true, priority_support: true, team: true, api_access: true }, sortOrder: 2 },
  ];

  for (const plan of defaultMembershipPlans) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: { ...plan, currency: 'USD', isActive: true },
    });
  }
  console.log('✅ Membership plans initialized');

  // Initialize default points configs
  const defaultPointsConfigs = [
    { key: 'daily_login', name: 'Daily Login', points: 10, description: 'Points for daily login', isEnabled: true },
    { key: 'complete_practice', name: 'Complete Practice', points: 20, description: 'Points for completing a practice session', isEnabled: true },
    { key: 'high_score', name: 'High Score Bonus', points: 50, description: 'Bonus points for scoring 90+', isEnabled: true },
    { key: 'invite_user', name: 'Invite User', points: 100, description: 'Points for inviting a new user', isEnabled: true },
  ];

  for (const config of defaultPointsConfigs) {
    await prisma.pointsConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('✅ Points configs initialized');

  // Initialize default plugins
  const defaultPlugins = [
    { slug: 'ai-conversation-analyzer', name: 'AI Conversation Analyzer', description: 'Analyze sales conversations using AI', icon: '🔍', version: '1.0.0', author: 'Master Trainer', category: 'AI_TOOLS' as const, price: 0, isActive: true, permissions: ['read:sessions', 'read:feedback'] },
    { slug: 'performance-analytics', name: 'Performance Analytics', description: 'Advanced analytics dashboard', icon: '📊', version: '1.0.0', author: 'Master Trainer', category: 'ANALYTICS' as const, price: 0, isActive: true, permissions: ['read:statistics', 'read:users'] },
    { slug: 'team-collaboration', name: 'Team Collaboration', description: 'Share and discuss with team members', icon: '👥', version: '1.0.0', author: 'Master Trainer', category: 'COMMUNICATION' as const, price: 0, isActive: true, permissions: ['read:users', 'write:notifications'] },
    { slug: 'gamification', name: 'Gamification', description: 'Badges, leaderboards, and achievements', icon: '🏆', version: '1.0.0', author: 'Master Trainer', category: 'PRODUCTIVITY' as const, price: 0, isActive: true, permissions: ['read:users', 'read:statistics'] },
  ];

  for (const plugin of defaultPlugins) {
    await prisma.plugin.upsert({
      where: { slug: plugin.slug },
      update: {},
      create: { ...plugin, screenshots: [], dependencies: [] },
    });
  }
  console.log('✅ Plugins initialized');

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@mastertrainer.com / admin123');
  console.log('Trainer: trainer@mastertrainer.com / trainer123');
  console.log('Demo User: demo@mastertrainer.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

