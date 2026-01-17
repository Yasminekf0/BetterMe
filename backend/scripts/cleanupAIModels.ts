/**
 * 清理AI模型数据库脚本
 * 只保留指定的5个AI模型，删除其他所有模型
 * 
 * 保留的模型:
 * 1. qwen3-max
 * 2. qwen2.5-vl-embedding
 * 3. qwen-tts
 * 4. qwen3-asr-flash-realtime
 * 5. text-embedding-v2
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 要保留的模型ID列表
const MODELS_TO_KEEP = [
  'qwen3-max',
  'qwen2.5-vl-embedding',
  'qwen-tts',
  'qwen3-asr-flash-realtime',
  'text-embedding-v2',
];

async function cleanupAIModels() {
  console.log('=== AI模型清理脚本 ===\n');
  
  try {
    // 1. 获取所有现有模型
    const allModels = await prisma.aIModel.findMany({
      select: {
        id: true,
        modelId: true,
        name: true,
        category: true,
      },
    });
    
    console.log(`当前数据库中共有 ${allModels.length} 个AI模型:\n`);
    allModels.forEach((model) => {
      const keepStatus = MODELS_TO_KEEP.includes(model.modelId) ? '✅ 保留' : '❌ 删除';
      console.log(`  ${keepStatus} - ${model.modelId} (${model.name}) [${model.category}]`);
    });
    
    // 2. 找出要删除的模型
    const modelsToDelete = allModels.filter(
      (model) => !MODELS_TO_KEEP.includes(model.modelId)
    );
    
    console.log(`\n将删除 ${modelsToDelete.length} 个模型:`);
    modelsToDelete.forEach((model) => {
      console.log(`  - ${model.modelId} (${model.name})`);
    });
    
    // 3. 执行删除
    if (modelsToDelete.length > 0) {
      const deleteResult = await prisma.aIModel.deleteMany({
        where: {
          modelId: {
            notIn: MODELS_TO_KEEP,
          },
        },
      });
      
      console.log(`\n✅ 成功删除 ${deleteResult.count} 个AI模型`);
    } else {
      console.log('\n没有需要删除的模型');
    }
    
    // 4. 验证结果
    const remainingModels = await prisma.aIModel.findMany({
      select: {
        id: true,
        modelId: true,
        name: true,
        category: true,
        isActive: true,
        isDefault: true,
      },
    });
    
    console.log(`\n=== 清理后剩余 ${remainingModels.length} 个模型 ===\n`);
    remainingModels.forEach((model) => {
      const defaultFlag = model.isDefault ? ' [默认]' : '';
      const activeFlag = model.isActive ? '' : ' [已禁用]';
      console.log(`  ✅ ${model.modelId} (${model.name}) [${model.category}]${defaultFlag}${activeFlag}`);
    });
    
    // 5. 检查是否有缺失的模型
    const existingModelIds = remainingModels.map((m) => m.modelId);
    const missingModels = MODELS_TO_KEEP.filter((id) => !existingModelIds.includes(id));
    
    if (missingModels.length > 0) {
      console.log(`\n⚠️  警告: 以下指定保留的模型不存在于数据库中:`);
      missingModels.forEach((id) => {
        console.log(`  - ${id}`);
      });
    }
    
  } catch (error) {
    console.error('清理过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
cleanupAIModels()
  .then(() => {
    console.log('\n=== 清理完成 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });

