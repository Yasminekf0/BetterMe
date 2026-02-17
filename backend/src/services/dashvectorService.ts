// backend/src/services/dashvector.service.ts

import axios from 'axios';

const DASHVECTOR_ENDPOINT = process.env.DASHVECTOR_ENDPOINT!;
const DASHVECTOR_API_KEY = process.env.DASHVECTOR_API_KEY!;
const COLLECTION_NAME = 'master_trainer_vectors';
const VECTOR_DIMENSION = 1536; // must match embedding model

export class DashVectorService {
  private client = axios.create({
    baseURL: DASHVECTOR_ENDPOINT,
    headers: {
      'Authorization': `Bearer ${DASHVECTOR_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  /**
   * Create collection safely (idempotent)
   */
  async createCollectionIfNotExists() {
    try {
      await this.client.post('/collections', {
        name: COLLECTION_NAME,
        dimension: VECTOR_DIMENSION,
        metric: 'dotproduct',
        dataType: 'FLOAT',
        fieldsSchema: {
          type: 'STRING',
          sourceId: 'STRING',
        },
      });
    } catch (err: any) {
      // DashVector returns error if collection exists → safe to ignore
      if (err.response?.data?.code !== 'COLLECTION_ALREADY_EXISTS') {
        throw err;
      }
    }
  }

  /**
   * Insert vectors
   */
  async upsertVector(id: string, vector: number[], metadata: any) {
    await this.client.post(`/collections/${COLLECTION_NAME}/docs`, {
      docs: [
        {
          id,
          vector,
          fields: metadata,
        },
      ],
    });
  }

  /**
   * Query similar vectors
   */
  async query(vector: number[], topK = 5) {
    const res = await this.client.post(
      `/collections/${COLLECTION_NAME}/query`,
      {
        vector,
        topK,
      }
    );

    return res.data?.results ?? [];
  }
}

export const dashvectorService = new DashVectorService();
