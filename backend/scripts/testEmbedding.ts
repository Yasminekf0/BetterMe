// backend/scripts/testEmbedding.ts
import { testEmbedding } from "../src/services/embeddingService";

(async () => {
  const result = await testEmbedding();
  console.log(JSON.stringify(result, null, 2));
})();
