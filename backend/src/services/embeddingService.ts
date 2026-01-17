// backend/src/services/embeddingService.ts

import "dotenv/config";

import axios from "axios";

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY!;
const DASHSCOPE_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding";

console.log("API key loaded:", !!process.env.DASHSCOPE_API_KEY);


//export class EmbeddingService {
//  async embed(text: string): Promise<number[]> {
    //const res = await axios.post(
  //    DASHSCOPE_ENDPOINT,
//      {
      //  model: "qwen2.5-vl-embedding",
    //    input: {
  //        text: text, // <-- REQUIRED SHAPE
//        },
      //},
    //  {
  //      headers: {
//          "Content-Type": "application/json",
         // Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
       // },
     // }
   // );

    //return res.data.output.embeddings[0].embedding;
  //}
//}

//export const embeddingService = new EmbeddingService();


export async function testEmbedding() {
  const res = await axios.post(
    "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding",
    {
      task: "text-embedding",
      model: "qwen2.5-vl-embedding",
      input: {
        texts: ["hello world"]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data;
}
