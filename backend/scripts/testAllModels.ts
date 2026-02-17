/**
 * 测试所有AI模型连接脚本
 * 1. 更新所有模型的API Key
 * 2. 测试每个模型的连接
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// API Key
const API_KEY = 'sk-52389248f75444f4bf0f37f5afff799d';

interface ApiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  data?: Array<{ embedding?: number[] }>;
  output?: {
    task_id?: string;
    embeddings?: Array<{ embedding?: number[] }>;
  };
  message?: string;
  error?: { message?: string };
}

async function updateAllApiKeys() {
  console.log('=== 更新所有模型的API Key ===\n');
  
  const result = await prisma.aIModel.updateMany({
    data: {
      apiKey: API_KEY,
    },
  });
  
  console.log(`✅ 已更新 ${result.count} 个模型的API Key\n`);
  return result.count;
}

async function testChatModel(modelId: string, apiKey: string, endpoint: string): Promise<{ success: boolean; message: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json() as ApiResponse;
    
    if (response.ok && data.choices) {
      const content = data.choices[0]?.message?.content || '';
      return {
        success: true,
        message: `响应: "${content.substring(0, 30)}"`,
        responseTime,
      };
    } else {
      return {
        success: false,
        message: data.message || data.error?.message || JSON.stringify(data).substring(0, 100),
        responseTime,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

async function testEmbeddingModel(modelId: string, apiKey: string, endpoint: string): Promise<{ success: boolean; message: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${endpoint}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        input: 'Hello world',
      }),
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json() as ApiResponse;
    
    if (response.ok && data.data) {
      const dimensions = data.data[0]?.embedding?.length || 0;
      return {
        success: true,
        message: `向量维度: ${dimensions}`,
        responseTime,
      };
    } else {
      return {
        success: false,
        message: data.message || data.error?.message || JSON.stringify(data).substring(0, 100),
        responseTime,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

async function testTTSModel(modelId: string, apiKey: string, endpoint?: string): Promise<{ success: boolean; message: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    // Qwen-TTS API (multimodal-generation)
    // 文档: https://help.aliyun.com/zh/model-studio/qwen-tts-api
    const apiEndpoint = endpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        input: {
          text: '你好',
          voice: 'Cherry',
          language_type: 'Chinese',
        },
      }),
    });
    
    const responseTime = Date.now() - startTime;
    const text = await response.text();
    
    if (response.ok || response.status === 200) {
      const hasAudio = text.includes('audio') && (text.includes('url') || text.includes('data'));
      return {
        success: hasAudio,
        message: hasAudio ? 'TTS成功，返回音频URL' : 'TTS响应无音频数据',
        responseTime,
      };
    } else {
      const data = JSON.parse(text) as ApiResponse;
      return {
        success: false,
        message: data.message || text.substring(0, 100),
        responseTime,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

async function testSTTModel(modelId: string, apiKey: string): Promise<{ success: boolean; message: string; responseTime: number }> {
  const startTime = Date.now();
  
  // STT模型使用WebSocket实时流，这里验证API key有效性
  try {
    // 使用Chat API验证API key
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      }),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'API Key无效或无权限',
        responseTime,
      };
    }
    
    return {
      success: true,
      message: `API Key有效 (STT使用WebSocket: wss://dashscope.aliyuncs.com/api-ws/v1/realtime)`,
      responseTime,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

async function testMultimodalEmbedding(modelId: string, apiKey: string): Promise<{ success: boolean; message: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        input: {
          contents: [
            {
              text: 'Hello world',
            },
          ],
        },
      }),
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json() as ApiResponse;
    
    if (response.ok && data.output) {
      const dimensions = data.output?.embeddings?.[0]?.embedding?.length || 0;
      return {
        success: true,
        message: `向量维度: ${dimensions}`,
        responseTime,
      };
    } else {
      return {
        success: false,
        message: data.message || JSON.stringify(data).substring(0, 100),
        responseTime,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

async function testAllModels() {
  console.log('=== AI模型连接测试 ===\n');
  console.log(`使用API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}\n`);
  
  try {
    // 1. 更新所有API Key
    await updateAllApiKeys();
    
    // 2. 获取所有模型
    const models = await prisma.aIModel.findMany({
      select: {
        id: true,
        modelId: true,
        name: true,
        category: true,
        apiEndpoint: true,
        apiKey: true,
      },
    });
    
    console.log(`共有 ${models.length} 个模型需要测试\n`);
    console.log('─'.repeat(60));
    
    // 3. 测试每个模型
    const results: { modelId: string; name: string; category: string; success: boolean; message: string; responseTime: number }[] = [];
    
    for (const model of models) {
      console.log(`\n测试: ${model.name} (${model.modelId}) [${model.category}]`);
      
      let result: { success: boolean; message: string; responseTime: number };
      
      switch (model.category) {
        case 'CHAT':
          result = await testChatModel(
            model.modelId,
            model.apiKey || API_KEY,
            model.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          );
          break;
          
        case 'EMBEDDING':
          result = await testEmbeddingModel(
            model.modelId,
            model.apiKey || API_KEY,
            model.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          );
          break;
          
        case 'TTS':
          result = await testTTSModel(model.modelId, model.apiKey || API_KEY, model.apiEndpoint || undefined);
          break;
          
        case 'STT':
          result = await testSTTModel(model.modelId, model.apiKey || API_KEY);
          break;
          
        case 'MULTIMODAL':
          result = await testMultimodalEmbedding(model.modelId, model.apiKey || API_KEY);
          break;
          
        default:
          result = { success: false, message: `未知分类: ${model.category}`, responseTime: 0 };
      }
      
      results.push({
        modelId: model.modelId,
        name: model.name,
        category: model.category,
        ...result,
      });
      
      const status = result.success ? '✅ 成功' : '❌ 失败';
      console.log(`  ${status} - ${result.message} (${result.responseTime}ms)`);
    }
    
    // 4. 输出总结
    console.log('\n' + '─'.repeat(60));
    console.log('\n=== 测试结果总结 ===\n');
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`❌ 失败: ${failCount} 个`);
    console.log(`📊 总计: ${results.length} 个\n`);
    
    if (failCount > 0) {
      console.log('失败的模型:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name} (${r.modelId}): ${r.message}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testAllModels()
  .then(() => {
    console.log('\n=== 测试完成 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
