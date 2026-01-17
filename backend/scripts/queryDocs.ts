import "dotenv/config";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

// Configuration - Replace these with your actual values
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY!;
const DASHVECTOR_API_KEY = process.env.DASHVECTOR_API_KEY!; // Might be the same as DASHSCOPE_API_KEY, verify in console
const DASHVECTOR_CLUSTER_ENDPOINT = process.env.DASHVECTOR_ENDPOINT; // e.g., https://dashvector.aliyuncs.com/api/v1
const COLLECTION_NAME = "bettermeCollection";

if (!DASHSCOPE_API_KEY || !DASHVECTOR_API_KEY || !DASHVECTOR_CLUSTER_ENDPOINT) {
  throw new Error("Required environment variables not set: DASHSCOPE_API_KEY, DASHVECTOR_API_KEY, DASHVECTOR_CLUSTER_ENDPOINT");
}

/**
 * Generates an embedding for a given text using the Dashscope API.
 * @param text The text to embed.
 * @returns A promise resolving to the embedding vector (array of numbers).
 */
async function getEmbedding(text: string): Promise<number[]> {
  const url = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding";

  try {
    const response = await axios.post(
      url,
      {
        model: "text-embedding-v2",
        input: {
          texts: [text] // Send as array of one element
        }
      },
      {
        headers: {
          Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Validate response structure
    if (!response.data?.output?.embeddings?.[0]?.embedding) {
      throw new Error(`Unexpected response format from Dashscope API: ${JSON.stringify(response.data)}`);
    }

    return response.data.output.embeddings[0].embedding;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Dashscope API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Network error while calling Dashscope API: ${error.message}`);
    }
  }
}

/**
 * Queries the DashVector collection for documents similar to the given vector.
 * @param vector The query embedding vector.
 * @param topk Number of top results to return.
 * @returns A promise resolving to the query result.
 */
async function queryDashVector(vector: number[], topk: number = 3): Promise<any> {
  const url = `${DASHVECTOR_CLUSTER_ENDPOINT}/v1/collections/${COLLECTION_NAME}/query`;

  try {
    const response = await axios.post(
      url,
      {
        vector: vector,
        topk: topk,
        include_vector: true // Return the vector in the result for debugging
        // You can add 'filter' or 'output_fields' here if needed, based on your schema
      },
      {
        headers: {
          'dashvector-auth-token': `${DASHVECTOR_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`DashVector Query API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Network error during DashVector query: ${error.message}`);
    }
  }
}

/**
 * Reads a text file and returns its content.
 * @param filePath Path to the text file.
 * @returns A promise resolving to the file content as a string.
 */
async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim(); // Remove leading/trailing whitespace
  } catch (error: any) {
    throw new Error(`Failed to read file ${filePath}: ${error.message}`);
  }
}

/**
 * Main function to query similar documents from DashVector.
 * @param queryFilePath Path to the text file containing the query.
 * @param topk Number of top similar documents to retrieve.
 */
async function main(queryFilePath: string, topk: number = 3) {
  console.log(`Starting query with file: ${queryFilePath}`);

  try {
    // 1. Read the query file content
    const queryText = await readFileContent(queryFilePath);
    console.log(`  Query text: "${queryText.substring(0, 100)}..."`);

    // 2. Generate embedding for the query
    console.log(`  Generating embedding for query...`);
    const queryEmbedding = await getEmbedding(queryText);
    console.log(`  Query embedding generated successfully. Length: ${queryEmbedding.length}`);

    // 3. Query DashVector for similar documents
    console.log(`  Querying collection '${COLLECTION_NAME}' for top ${topk} similar documents...`);
    const queryResult = await queryDashVector(queryEmbedding, topk);

    // 4. Validate and display results
    if (!queryResult || queryResult.code !== 0) {
      throw new Error(`Query failed: ${queryResult?.message || 'Unknown error'}`);
    }

    console.log(`\n--- Query Results ---`);
    console.log(`Found ${queryResult.output?.length || 0} similar documents.`);

    if (queryResult.output && queryResult.output.length > 0) {
      for (let i = 0; i < queryResult.output.length; i++) {
        const doc = queryResult.output[i];
        console.log(`\nResult #${i + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Similarity Score: ${doc.score}`); // Assuming 'score' is returned (common in similarity search)
        console.log(`  Original Text: ${doc.fields?.text ? `"${doc.fields.text.substring(0, 200)}..."` : "(No text field)"}`);
        // If you stored other fields, they would be under doc.fields
      }
    } else {
      console.log("No similar documents found.");
    }

    console.log(`\nQuery completed successfully.`);
  } catch (error: any) {
    console.error(`Error during query: ${error.message}`);
    process.exit(1);
  }
}

// --- Example Usage ---

// Define the path to your query text file.
// This should be a single .txt file that contains the text you want to search for.
const queryFilePath = "./queries/query1.txt"; // Replace with your actual query file path

// Optionally, specify how many top results you want (default is 3)
const topK = 3;

// Run the main function
main(queryFilePath, topK).catch(err => {
  console.error("An error occurred during execution:", err);
  process.exit(1); // Exit with error code
});