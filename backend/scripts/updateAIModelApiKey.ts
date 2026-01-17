import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 更新AI模型的API Key
 * Update AI Model API Key
 * 
 * 为所有Alibaba（阿里云）相关的AI模型添加API Key
 * Add API Key to all Alibaba-related AI models
 */
async function main() {
  // 阿里云DashScope API Key
  // Alibaba DashScope API Key
  const DASHSCOPE_API_KEY = 'sk-52389248f75444f4bf0f37f5afff799d';

  console.log('🔑 正在更新AI模型API Key...');
  console.log('🔑 Updating AI Model API Keys...');

  try {
    // 更新所有Alibaba相关的AI模型
    // Update all Alibaba-related AI models
    const result = await prisma.aIModel.updateMany({
      where: {
        provider: 'Alibaba',
      },
      data: {
        apiKey: DASHSCOPE_API_KEY,
      },
    });

    console.log(`✅ 已更新 ${result.count} 个阿里云AI模型的API Key`);
    console.log(`✅ Updated API Key for ${result.count} Alibaba AI models`);

    // 列出所有已更新的模型
    // List all updated models
    const updatedModels = await prisma.aIModel.findMany({
      where: {
        provider: 'Alibaba',
      },
      select: {
        modelId: true,
        name: true,
        category: true,
        apiKey: true,
      },
    });

    console.log('\n📋 已更新的模型列表 / Updated models:');
    updatedModels.forEach((model) => {
      const maskedKey = model.apiKey ? `${model.apiKey.substring(0, 8)}****` : 'N/A';
      console.log(`  - ${model.name} (${model.modelId}) [${model.category}]: ${maskedKey}`);
    });

    console.log('\n🎉 API Key更新完成！');
    console.log('🎉 API Key update completed!');

  } catch (error) {
    console.error('❌ 更新API Key时出错:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

