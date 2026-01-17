/**
 * RAG Service - Document Processing, Chunking and Vectorization
 * RAG服务 - 文档处理、切块和向量化
 * 
 * Supports file formats / 支持的文件格式:
 * - PDF (.pdf)
 * - Word (.doc, .docx)
 * - PowerPoint (.ppt, .pptx)
 * - Excel (.xls, .xlsx)
 * - Text (.txt)
 * - CSV (.csv)
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

// ==================== Configuration / 配置 ====================

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY!;
const DASHVECTOR_API_KEY = process.env.DASHVECTOR_API_KEY!;
const DASHVECTOR_CLUSTER_ENDPOINT = process.env.DASHVECTOR_ENDPOINT;
const COLLECTION_NAME = process.env.RAG_COLLECTION_NAME || 'bettermeCollection';

// Default chunk settings / 默认切块设置
const DEFAULT_CHUNK_SIZE = 500;      // Characters per chunk / 每个块的字符数
const DEFAULT_CHUNK_OVERLAP = 50;    // Overlap between chunks / 块之间的重叠
const DEFAULT_SEPARATOR = '\n\n';    // Default separator / 默认分隔符

// ==================== Interfaces / 接口定义 ====================

/**
 * Document chunk interface
 * 文档块接口
 */
export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    totalChunks: number;
    startOffset: number;
    endOffset: number;
    fileType: string;
  };
}

/**
 * Chunk options interface
 * 切块选项接口
 */
export interface ChunkOptions {
  chunkSize?: number;      // Size of each chunk in characters / 每个块的大小（字符数）
  chunkOverlap?: number;   // Overlap between chunks / 块之间的重叠
  separator?: string;      // Text separator / 文本分隔符
}

/**
 * RAG Document interface
 * RAG文档接口
 */
export interface RAGDocument {
  id: string;
  name: string;
  originalName: string;
  fileType: string;
  content: string;
  chunks: DocumentChunk[];
  chunkCount: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
}

/**
 * Vector insert result interface
 * 向量插入结果接口
 */
export interface VectorInsertResult {
  success: boolean;
  insertedCount: number;
  failedCount: number;
  errors?: string[];
}

// ==================== RAG Service Class / RAG服务类 ====================

export class RAGService {
  
  /**
   * Parse document content based on file type
   * 根据文件类型解析文档内容
   * 
   * @param filePath - Path to the file / 文件路径
   * @param fileType - File extension / 文件扩展名
   * @returns Parsed text content / 解析后的文本内容
   */
  async parseDocument(filePath: string, fileType: string): Promise<string> {
    const ext = fileType.toLowerCase().replace('.', '');
    
    try {
      switch (ext) {
        case 'txt':
        case 'csv':
          return await this.parseTextFile(filePath);
        case 'pdf':
          return await this.parsePDF(filePath);
        case 'doc':
        case 'docx':
          return await this.parseWord(filePath);
        case 'ppt':
        case 'pptx':
          return await this.parsePowerPoint(filePath);
        case 'xls':
        case 'xlsx':
          return await this.parseExcel(filePath);
        default:
          // Try to read as text for unknown types / 对于未知类型尝试作为文本读取
          return await this.parseTextFile(filePath);
      }
    } catch (error: any) {
      logger.error(`Failed to parse document / 文档解析失败: ${filePath}`, { error: error.message });
      throw new Error(`Document parsing failed / 文档解析失败: ${error.message}`);
    }
  }

  /**
   * Parse plain text file
   * 解析纯文本文件
   */
  private async parseTextFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim();
  }

  /**
   * Parse PDF file
   * 解析PDF文件
   * Uses pdf-parse library / 使用pdf-parse库
   */
  private async parsePDF(filePath: string): Promise<string> {
    try {
      // Dynamic import for pdf-parse / 动态导入pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text.trim();
    } catch (error: any) {
      logger.error('PDF parsing error / PDF解析错误', { error: error.message });
      throw new Error(`PDF parsing failed / PDF解析失败: ${error.message}`);
    }
  }

  /**
   * Parse Word document (.doc, .docx)
   * 解析Word文档
   * Uses mammoth library / 使用mammoth库
   */
  private async parseWord(filePath: string): Promise<string> {
    try {
      // Dynamic import for mammoth / 动态导入mammoth
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.trim();
    } catch (error: any) {
      logger.error('Word parsing error / Word解析错误', { error: error.message });
      throw new Error(`Word parsing failed / Word解析失败: ${error.message}`);
    }
  }

  /**
   * Parse PowerPoint file (.ppt, .pptx)
   * 解析PowerPoint文件
   * Uses officeparser library / 使用officeparser库
   */
  private async parsePowerPoint(filePath: string): Promise<string> {
    try {
      // Dynamic import for officeparser / 动态导入officeparser
      const officeParser = await import('officeparser');
      const text = await officeParser.parseOfficeAsync(filePath);
      return text.trim();
    } catch (error: any) {
      logger.error('PowerPoint parsing error / PowerPoint解析错误', { error: error.message });
      throw new Error(`PowerPoint parsing failed / PowerPoint解析失败: ${error.message}`);
    }
  }

  /**
   * Parse Excel file (.xls, .xlsx)
   * 解析Excel文件
   * Uses xlsx library / 使用xlsx库
   */
  private async parseExcel(filePath: string): Promise<string> {
    try {
      // Dynamic import for xlsx / 动态导入xlsx
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      
      let fullText = '';
      
      // Process each sheet / 处理每个工作表
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const text = XLSX.utils.sheet_to_txt(sheet);
        fullText += `--- Sheet: ${sheetName} ---\n${text}\n\n`;
      }
      
      return fullText.trim();
    } catch (error: any) {
      logger.error('Excel parsing error / Excel解析错误', { error: error.message });
      throw new Error(`Excel parsing failed / Excel解析失败: ${error.message}`);
    }
  }

  /**
   * Split text into chunks with overlap
   * 将文本切分成带重叠的块
   * 
   * @param text - Full text content / 完整文本内容
   * @param documentId - Document identifier / 文档标识符
   * @param documentName - Document name / 文档名称
   * @param fileType - File type / 文件类型
   * @param options - Chunking options / 切块选项
   * @returns Array of document chunks / 文档块数组
   */
  splitIntoChunks(
    text: string,
    documentId: string,
    documentName: string,
    fileType: string,
    options: ChunkOptions = {}
  ): DocumentChunk[] {
    const {
      chunkSize = DEFAULT_CHUNK_SIZE,
      chunkOverlap = DEFAULT_CHUNK_OVERLAP,
      separator = DEFAULT_SEPARATOR,
    } = options;

    const chunks: DocumentChunk[] = [];
    
    // First, try to split by separator / 首先尝试按分隔符切分
    let segments = text.split(separator);
    
    // If no separators found, split by sentences / 如果没找到分隔符，按句子切分
    if (segments.length === 1) {
      segments = text.split(/(?<=[.!?。！？])\s+/);
    }

    let currentChunk = '';
    let startOffset = 0;
    let chunkIndex = 0;

    for (const segment of segments) {
      // If adding this segment exceeds chunk size / 如果添加此段会超过块大小
      if (currentChunk.length + segment.length > chunkSize && currentChunk.length > 0) {
        // Save current chunk / 保存当前块
        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          text: currentChunk.trim(),
          metadata: {
            documentId,
            documentName,
            chunkIndex,
            totalChunks: 0, // Will be updated later / 稍后更新
            startOffset,
            endOffset: startOffset + currentChunk.length,
            fileType,
          },
        });

        // Start new chunk with overlap / 以重叠开始新块
        const overlapText = currentChunk.slice(-chunkOverlap);
        startOffset = startOffset + currentChunk.length - chunkOverlap;
        currentChunk = overlapText;
        chunkIndex++;
      }

      currentChunk += (currentChunk ? separator : '') + segment;
    }

    // Don't forget the last chunk / 别忘了最后一个块
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        text: currentChunk.trim(),
        metadata: {
          documentId,
          documentName,
          chunkIndex,
          totalChunks: 0,
          startOffset,
          endOffset: startOffset + currentChunk.length,
          fileType,
        },
      });
    }

    // Update total chunks count / 更新总块数
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = totalChunks;
    });

    logger.info(`Document chunked / 文档已切块`, {
      documentId,
      documentName,
      totalChunks,
      chunkSize,
      chunkOverlap,
    });

    return chunks;
  }

  /**
   * Generate embedding for text using Dashscope API
   * 使用Dashscope API为文本生成嵌入向量
   * 
   * @param text - Text to embed / 要嵌入的文本
   * @returns Embedding vector / 嵌入向量
   */
  async getEmbedding(text: string): Promise<number[]> {
    const url = "https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding";

    try {
      const response = await axios.post(
        url,
        {
          model: "text-embedding-v2",
          input: {
            texts: [text]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Validate response structure / 验证响应结构
      if (!response.data?.output?.embeddings?.[0]?.embedding) {
        throw new Error(`Unexpected response format from Dashscope API / Dashscope API响应格式异常: ${JSON.stringify(response.data)}`);
      }

      return response.data.output.embeddings[0].embedding;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Dashscope API Error / Dashscope API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        throw new Error(`Network error while calling Dashscope API / 调用Dashscope API时网络错误: ${error.message}`);
      }
    }
  }

  /**
   * Insert vector into DashVector collection
   * 将向量插入DashVector集合
   * 
   * @param id - Document ID / 文档ID
   * @param text - Original text / 原始文本
   * @param vector - Embedding vector / 嵌入向量
   * @param metadata - Additional metadata / 附加元数据
   * @returns Insert result / 插入结果
   */
  async insertIntoDashVector(
    id: string,
    text: string,
    vector: number[],
    metadata: Record<string, any> = {}
  ): Promise<any> {
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
                text: text,
                ...metadata,
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
        throw new Error(`DashVector API Error / DashVector API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        throw new Error(`Network error while inserting into DashVector / 插入DashVector时网络错误: ${error.message}`);
      }
    }
  }

  /**
   * Process document: parse, chunk, embed and store
   * 处理文档：解析、切块、嵌入和存储
   * 
   * @param filePath - Path to the uploaded file / 上传文件的路径
   * @param fileName - Original file name / 原始文件名
   * @param documentId - Unique document ID / 唯一文档ID
   * @param options - Chunk options / 切块选项
   * @returns Processing result / 处理结果
   */
  async processDocument(
    filePath: string,
    fileName: string,
    documentId: string,
    options: ChunkOptions = {}
  ): Promise<VectorInsertResult> {
    const fileType = path.extname(fileName).toLowerCase();
    
    logger.info(`Starting document processing / 开始处理文档`, {
      documentId,
      fileName,
      fileType,
    });

    try {
      // Step 1: Parse document / 步骤1：解析文档
      logger.info(`Parsing document / 解析文档中...`, { documentId });
      const content = await this.parseDocument(filePath, fileType);
      
      if (!content || content.trim().length === 0) {
        throw new Error('Document is empty or could not be parsed / 文档为空或无法解析');
      }

      // Step 2: Split into chunks / 步骤2：切分成块
      logger.info(`Chunking document / 切分文档中...`, { documentId });
      const chunks = this.splitIntoChunks(content, documentId, fileName, fileType, options);

      // Step 3: Generate embeddings and insert into DashVector / 步骤3：生成嵌入向量并插入DashVector
      logger.info(`Processing ${chunks.length} chunks / 处理 ${chunks.length} 个块...`, { documentId });
      
      let insertedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const chunk of chunks) {
        try {
          // Generate embedding / 生成嵌入向量
          const embedding = await this.getEmbedding(chunk.text);
          
          // Insert into DashVector / 插入DashVector
          await this.insertIntoDashVector(
            chunk.id,
            chunk.text,
            embedding,
            {
              documentId: chunk.metadata.documentId,
              documentName: chunk.metadata.documentName,
              chunkIndex: chunk.metadata.chunkIndex,
              totalChunks: chunk.metadata.totalChunks,
              fileType: chunk.metadata.fileType,
            }
          );
          
          insertedCount++;
          logger.info(`Chunk ${chunk.metadata.chunkIndex + 1}/${chunk.metadata.totalChunks} inserted / 块 ${chunk.metadata.chunkIndex + 1}/${chunk.metadata.totalChunks} 已插入`, {
            chunkId: chunk.id,
          });
        } catch (error: any) {
          failedCount++;
          errors.push(`Chunk ${chunk.id}: ${error.message}`);
          logger.error(`Failed to process chunk / 处理块失败`, {
            chunkId: chunk.id,
            error: error.message,
          });
        }
      }

      logger.info(`Document processing completed / 文档处理完成`, {
        documentId,
        insertedCount,
        failedCount,
      });

      return {
        success: failedCount === 0,
        insertedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      logger.error(`Document processing failed / 文档处理失败`, {
        documentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Query similar documents from DashVector
   * 从DashVector查询相似文档
   * 
   * @param query - Query text / 查询文本
   * @param topK - Number of results to return / 返回结果数量
   * @returns Similar documents / 相似文档
   */
  async querySimilarDocuments(query: string, topK: number = 5): Promise<any[]> {
    try {
      // Generate embedding for query / 为查询生成嵌入向量
      const queryEmbedding = await this.getEmbedding(query);
      
      // Query DashVector / 查询DashVector
      const url = `${DASHVECTOR_CLUSTER_ENDPOINT}/v1/collections/${COLLECTION_NAME}/query`;
      
      const response = await axios.post(
        url,
        {
          vector: queryEmbedding,
          topk: topK,
          include_vector: false,
        },
        {
          headers: {
            'dashvector-auth-token': `${DASHVECTOR_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      return response.data?.output || [];
    } catch (error: any) {
      logger.error(`Query similar documents failed / 查询相似文档失败`, { error: error.message });
      throw error;
    }
  }

  /**
   * Delete document vectors from DashVector
   * 从DashVector删除文档向量
   * 
   * @param documentId - Document ID to delete / 要删除的文档ID
   * @returns Delete result / 删除结果
   */
  async deleteDocumentVectors(documentId: string): Promise<any> {
    try {
      // First, we need to find all chunk IDs for this document / 首先需要找到该文档的所有块ID
      // DashVector supports delete by filter / DashVector支持按过滤条件删除
      const url = `${DASHVECTOR_CLUSTER_ENDPOINT}/v1/collections/${COLLECTION_NAME}/docs`;
      
      const response = await axios.delete(
        url,
        {
          headers: {
            'dashvector-auth-token': `${DASHVECTOR_API_KEY}`,
            "Content-Type": "application/json"
          },
          data: {
            filter: `documentId = '${documentId}'`
          }
        }
      );

      logger.info(`Document vectors deleted / 文档向量已删除`, { documentId });
      return response.data;
    } catch (error: any) {
      logger.error(`Delete document vectors failed / 删除文档向量失败`, { 
        documentId, 
        error: error.message 
      });
      throw error;
    }
  }
}

// Export singleton instance / 导出单例实例
export const ragService = new RAGService();
export default ragService;

