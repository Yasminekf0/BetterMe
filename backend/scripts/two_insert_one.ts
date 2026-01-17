// scripts/2_insert_one.ts
import 'dotenv/config';
import axios from 'axios';
import http from 'http';
import https from 'https';

const httpAgent = new http.Agent({ family: 4 });
const httpsAgent = new https.Agent({ family: 4 });

// Make sure these point to DashVector, NOT your backend
const DASHVECTOR_KEY = process.env.DASHVECTOR_API_KEY!;
const DASHVECTOR_ENDPOINT = process.env.DASHVECTOR_ENDPOINT!; // Should be dashvector endpoint
const COLLECTION = 'knowledge_base';

async function insertOne() {
  try {
    // Validate environment variables
    if (!process.env.DASHSCOPE_API_KEY) {
      throw new Error('DASHSCOPE_API_KEY is missing in environment variables');
    }
    if (!DASHVECTOR_KEY) {
      throw new Error('DASHVECTOR_API_KEY is missing in environment variables');
    }
    if (!DASHVECTOR_ENDPOINT) {
      throw new Error('DASHVECTOR_ENDPOINT is missing in environment variables');
    }

    // 1. Get embedding from DashScope
    console.log('Environment variable DASHVECTOR_ENDPOINT:', process.env.DASHVECTOR_ENDPOINT);
    console.log('Using endpoint:', `${DASHVECTOR_ENDPOINT}/v1/collections/${COLLECTION}/docs`);
    console.log('Getting embedding from DashScope...');
    const embedRes = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
      { 
        model: 'text-embedding-v2', 
        input: { 
          texts: ['Regular exercise reduces anxiety.'] 
        } 
      },
      { 
        headers: { 
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,  // DashScope uses Bearer token
          'Content-Type': 'application/json'
        } 
      }
    );
    
    const vector = embedRes.data.output.embeddings[0].embedding;
    console.log('Embedding retrieved successfully');

    // 2. Insert into DashVector directly
    console.log('Inserting into DashVector...');
    const dashRes = await axios.post(
      `${DASHVECTOR_ENDPOINT}/v1/collections/${COLLECTION}/docs`, // This should be your DashVector endpoint
      {
        docs: [
          {
            id: 'doc_1',
            vector,
            fields: {
              text: 'Regular exercise reduces anxiety.',
              source: 'health_guide.pdf',
              page: 5,
              user_id: 'user_123',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      },
      {
        headers: {
          'dashvector-auth-token': DASHVECTOR_KEY,  // DashVector uses this custom header
          'Content-Type': 'application/json',
        },
        httpAgent,
        httpsAgent,
      }
    );

    console.log('Insert response:', dashRes.data);
  } catch (error) {
    console.error('Error details:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      
      // Check authentication headers
      const dashvectorHeader = error.config?.headers?.['dashvector-auth-token'];
      const dashscopeHeader = error.config?.headers?.Authorization;
      console.error('DashVector auth header present:', !!dashvectorHeader);
      console.error('DashScope auth header present:', !!dashscopeHeader);
      
      if (error.response?.status === -2021 || error.response?.status === 401) {
        console.error('Authentication error: Please verify your API keys are correct and have proper permissions');
      }
    } else {
      console.error('General error:', error);
    }
  }
}

insertOne();