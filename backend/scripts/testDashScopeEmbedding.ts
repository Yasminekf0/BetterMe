import "dotenv/config";
import axios from "axios";

async function run() {
  const API_KEY = process.env.DASHSCOPE_API_KEY!;
  if (!API_KEY) {
    throw new Error("API key not set");
  }

  const res = await axios.post(
    "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding",
    {
      model: "text-embedding-v2",
      input: {
        texts: ["hello world"]
      }
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("STATUS:", res.status);
  console.log("BODY:", JSON.stringify(res.data, null, 2));
}

run().catch(err => {
  if (err.response?.data) {
    console.log("ERROR BODY:", JSON.stringify(err.response.data, null, 2));
  } else {
    console.error(err);
  }
});
