import "dotenv/config";
import axios from "axios";

const API_KEY = process.env.DASHSCOPE_API_KEY;

if (!API_KEY) {
  throw new Error("DASHSCOPE_API_KEY not set");
}

async function run() {
  const res = await axios.post(
    "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding",
    {
      model: "qwen2.5-vl-embedding",
      input: {
        texts: ["hello world"],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    }
  );

  console.log("STATUS:", res.status);
  console.log("BODY:", JSON.stringify(res.data, null, 2));
}

run();
