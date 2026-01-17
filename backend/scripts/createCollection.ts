// scripts/createCollection.ts
import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.DASHVECTOR_API_KEY!;
const ENDPOINT = process.env.DASHVECTOR_ENDPOINT!;
const COLLECTION_NAME = 'betterme_kb';

async function createCollection() {
  try {
    const res = await axios.post(
      `${ENDPOINT}/v1/collections`,
      {
        name: COLLECTION_NAME,
        dimension: 1536,
        metric: 'cosine',
        fields_schema: {
          text: 'string',
          source: 'string',
          page: 'int64',
        },
      },
      {
        headers: {
          Authorization: API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Collection created:', res.data);
  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createCollection();