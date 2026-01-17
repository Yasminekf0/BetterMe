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
 * Inserts a single document (text + embedding) into the DashVector collection.
 * @param id A unique identifier for the document.
 * @param text The original text content.
 * @param vector The embedding vector.
 * @returns A promise resolving to the insert result.
 */
async function insertIntoDashVector(id: string, text: string, vector: number[]): Promise<any> {
  const url = `${DASHVECTOR_CLUSTER_ENDPOINT}/v1/collections/${COLLECTION_NAME}/docs`;

  
  try {
    const response = await axios.post(
      url,
      {
        docs: [
          {
            id: id,
            vector: vector,
            fields: {
              text: text // Store the original text as a field for retrieval later
            }
          }
        ]
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
      throw new Error(`DashVector API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Network error while inserting into DashVector: ${error.message}`);
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
 * Main function to process text files and insert them into DashVector.
 * @param filePaths Array of paths to text files to process.
 */
async function main(filePaths: string[]) {
  console.log(`Starting to process ${filePaths.length} files...`);

  for (const filePath of filePaths) {
    try {
      console.log(`Processing file: ${filePath}`);

      // 1. Read the file content
      const text = await readFileContent(filePath);

      // 2. Generate embedding
      console.log(`  Generating embedding...`);
      const embedding = await getEmbedding(text);
      console.log(`  Embedding generated successfully. Length: ${embedding.length}`);

      // 3. Prepare ID (using filename without extension as a simple ID)
      const fileName = path.basename(filePath, path.extname(filePath));
      const docId = fileName;

      // 4. Insert into DashVector
      console.log(`  Inserting into collection '${COLLECTION_NAME}' with ID: ${docId}`);
      const insertResult = await insertIntoDashVector(docId, text, embedding);
      console.log(`  Insert successful. Result:`, insertResult);

      console.log(`File processed successfully: ${filePath}\n`);
    } catch (error: any) {
      console.error(`Error processing file ${filePath}: ${error.message}`);
      // Optionally, continue with next file or re-throw
      // throw error; // Uncomment to stop on first error
    }
  }

  console.log("All files processed.");
}

// --- Example Usage ---

// Define the paths to your text files here.
// You can modify this part to read from a directory dynamically if needed.
const textFilePaths = [
  "./documents/product1.txt", // Replace with your actual file paths
  "./documents/person1.txt",
  // Add more file paths as needed
];

// Run the main function
main(textFilePaths).catch(err => {
  console.error("An error occurred during execution:", err);
  process.exit(1); // Exit with error code
});