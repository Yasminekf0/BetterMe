import { logger } from "../utils/logger";
import axios from "axios";

/**
 * Aliyun Speech-to-Text Service
 * Integrates with Aliyun OSS and Speech Recognition
 *
 * Prerequisites:
 * 1. Aliyun account with Speech Recognition API enabled
 * 2. AccessKeyId and AccessKeySecret configured in environment
 * 3. OSS bucket configured for temporary audio storage
 *
 * Environment Variables Required:
 * - ALIYUN_ACCESS_KEY_ID
 * - ALIYUN_ACCESS_KEY_SECRET
 * - ALIYUN_REGION_ID (e.g., cn-hangzhou)
 * - ALIYUN_OSS_BUCKET
 */

interface TranscribeOptions {
  language?: string;
  punctuation?: boolean;
  modelName?: string;
}

interface TranscribeResult {
  text: string;
  confidence: number;
  duration: number;
}

class AliyunSTTService {
  private accessKeyId: string;
  private accessKeySecret: string;
  private regionId: string;
  private ossBucket: string;
  private sttEndpoint: string;

  constructor() {
    this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || "";
    this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || "";
    this.regionId = process.env.ALIYUN_REGION_ID || "cn-hangzhou";
    this.ossBucket = process.env.ALIYUN_OSS_BUCKET || "";

    this.sttEndpoint = "http://nlsapi.cn-shanghai.aliyuncs.com/asr/recognize";

    // Aliyun Speech API endpoint

    if (!this.accessKeyId || !this.accessKeySecret) {
      logger.warn("Aliyun STT credentials not configured", {
        hasAccessKeyId: !!this.accessKeyId,
        hasAccessKeySecret: !!this.accessKeySecret,
      });
    }
  }
 
  /**
   * Transcribe audio using Aliyun Speech-to-Text API
   */
  async transcribe(
    audioData: Buffer,
    options: TranscribeOptions = {},
  ): Promise<TranscribeResult> {
    try {
      const {
        language = "en-US",
        punctuation = true,
        modelName = "English", // Match your BetterMe project model
      } = options;

      logger.info("Starting Aliyun STT transcription", {
        audioSize: audioData.length,
        language,
        modelName,
      });

      // ❌ DELETE THESE TWO LINES (causing the error)
      // const token = await this.getAuthToken();
      // const audioUrl = await this.uploadAudioToOSS(audioData, fileName);

      // ✅ Direct API call (no token/OSS)
      const response = await axios.post(
        this.sttEndpoint,
        audioData, // Raw PCM audio buffer
        {
          params: {
            access_key_id: this.accessKeyId,
            access_key_secret: this.accessKeySecret,
            format: "pcm",
            sample_rate: 16000,
            language: language,
            model: modelName,
            enable_punctuation_prediction: punctuation ? "true" : "false",
          },
          headers: {
            "Content-Type": "application/octet-stream", // Critical for PCM
            Accept: "application/json",
          },
          timeout: 10000,
        },
      );

      // ✅ Fix response parsing (match Aliyun's actual response format)
      const data = response.data;
      if (data.status !== 200 || !data.result) {
        throw new Error(
          `Transcription failed: ${data.message || "No result returned"}`,
        );
      }

      // Calculate duration (bytes / (16000 Hz * 2 bytes per sample))
      const durationMs = Math.round((audioData.length / (16000 * 2)) * 1000);

      const result: TranscribeResult = {
        text: data.result,
        confidence: data.confidence || 1.0,
        duration: durationMs,
      };

      logger.info("Transcription completed", {
        text: result.text,
        confidence: result.confidence,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      logger.error("Aliyun STT transcription failed", { error });
      throw error;
    }
  }

  /**
   * Get recognized words with confidence scores
   */
  async getDetailedRecognition(
    audioData: Buffer,
  ): Promise<Array<{ word: string; confidence: number }>> {
    try {
      const result = await this.transcribe(audioData, {
        language: "en-US",
        punctuation: true,
        modelName: "English",
      });

      // TODO: Parse detailed recognition results from Aliyun response
      // This is a simplified placeholder

      logger.info("Retrieved detailed recognition results");

      return [];
    } catch (error) {
      logger.error("Failed to get detailed recognition", { error });
      throw error;
    }
  }
}

// Export singleton instance
export const aliyunSTTService = new AliyunSTTService();
