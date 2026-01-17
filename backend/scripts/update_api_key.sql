-- 更新所有阿里云AI模型的API Key
-- Update API Key for all Alibaba AI models

UPDATE ai_models 
SET apiKey = 'sk-52389248f75444f4bf0f37f5afff799d',
    updatedAt = NOW()
WHERE provider = 'Alibaba';

-- 验证更新结果 / Verify the update
SELECT modelId, name, category, provider, 
       CONCAT(LEFT(apiKey, 8), '****') as maskedApiKey
FROM ai_models 
WHERE provider = 'Alibaba';

