import { logger } from '../utils/logger';
import axios from 'axios';

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
  private endpoint: string;

  constructor() {
    this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || '';
    this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || '';
    this.regionId = process.env.ALIYUN_REGION_ID || 'cn-hangzhou';
    this.ossBucket = process.env.ALIYUN_OSS_BUCKET || '';

    // Aliyun Speech API endpoint
    this.endpoint = `https://nls-gateway-${this.regionId}.aliyuncs.com/rest/api/v1`;

    if (!this.accessKeyId || !this.accessKeySecret) {
      logger.warn('Aliyun STT credentials not configured', {
        hasAccessKeyId: !!this.accessKeyId,
        hasAccessKeySecret: !!this.accessKeySecret,
      });
    }
  }

  /**
   * Get authentication token from Aliyun
   * Token expires after 1 hour
   */
  private async getAuthToken(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.endpoint}/token`,
        {
          AccessKeyId: this.accessKeyId,
          AccessKeySecret: this.accessKeySecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.Token) {
        logger.debug('Aliyun auth token obtained');
        return response.data.Token;
      }

      throw new Error('No token in response');
    } catch (error) {
      logger.error('Failed to get Aliyun auth token', { error });
      throw error;
    }
  }

  /**
   * Upload audio to Aliyun OSS for processing
   * Returns the OSS file URL for transcription
   */
  private async uploadAudioToOSS(
    audioData: Buffer,
    fileName: string
  ): Promise<string> {
    try {
      // TODO: Implement OSS upload using @alicloud/oss-sdk-js
      // This is a placeholder for the actual implementation

      logger.info('Uploading audio to Aliyun OSS', {
        fileName,
      });

      // Example: OSS URL would be like:
      // https://your-bucket.oss-cn-hangzhou.aliyuncs.com/audio/session-id-timestamp.wav
      const ossUrl = `https://${this.ossBucket}.oss-${this.regionId}.aliyuncs.com/audio/${fileName}`;

      return ossUrl;
    } catch (error) {
      logger.error('Failed to upload audio to OSS', { error });
      throw error;
    }
  }

  /**
   * Transcribe audio using Aliyun Speech-to-Text API
   */
  async transcribe(
    audioData: Buffer,
    options: TranscribeOptions = {}
  ): Promise<TranscribeResult> {
    try {
      const {
        language = 'zh-CN',
        punctuation = true,
        modelName = 'general',
      } = options;

      logger.info('Starting Aliyun STT transcription', {
        audioSize: audioData.length,
        language,
        modelName,
      });

      // Get authentication token
      const token = await this.getAuthToken();

      // Upload audio to OSS
      const timestamp = Date.now();
      const fileName = `audio-${timestamp}.wav`;
      const audioUrl = await this.uploadAudioToOSS(audioData, fileName);

      // Call Aliyun Speech Recognition API
      const response = await axios.post(
        `${this.endpoint}/recognize`,
        {
          TaskName: `task-${timestamp}`,
          ModelName: modelName,
          SourceLanguage: language,
          AudioUrl: audioUrl,
          Output: 'json',
          PunctuationPrediction: punctuation,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 60000,
        }
      );

      if (!response.data || response.data.Status !== 3) {
        throw new Error(`Transcription failed with status: ${response.data?.Status}`);
      }

      const result: TranscribeResult = {
        text: response.data.Result || '',
        confidence: response.data.Confidence || 0,
        duration: response.data.Duration || 0,
      };

      logger.info('Transcription completed', {
        text: result.text,
        confidence: result.confidence,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      logger.error('Aliyun STT transcription failed', { error });
      throw error;
    }
  }

  /**
   * Transcribe audio file from OSS
   */
  async transcribeFromOSS(
    ossUrl: string,
    options: TranscribeOptions = {}
  ): Promise<TranscribeResult> {
    try {
      const { language = 'zh-CN', punctuation = true, modelName = 'general' } =
        options;

      logger.info('Starting transcription from OSS', {
        ossUrl,
        language,
        modelName,
      });

      // Get authentication token
      const token = await this.getAuthToken();

      // Call Aliyun Speech Recognition API
      const response = await axios.post(
        `${this.endpoint}/recognize`,
        {
          TaskName: `task-${Date.now()}`,
          ModelName: modelName,
          SourceLanguage: language,
          AudioUrl: ossUrl,
          Output: 'json',
          PunctuationPrediction: punctuation,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: 60000,
        }
      );

      if (!response.data || response.data.Status !== 3) {
        throw new Error(`Transcription failed with status: ${response.data?.Status}`);
      }

      const result: TranscribeResult = {
        text: response.data.Result || '',
        confidence: response.data.Confidence || 0,
        duration: response.data.Duration || 0,
      };

      return result;
    } catch (error) {
      logger.error('OSS transcription failed', { error });
      throw error;
    }
  }

  /**
   * Get recognized words with confidence scores
   */
  async getDetailedRecognition(
    audioData: Buffer
  ): Promise<Array<{ word: string; confidence: number }>> {
    try {
      const result = await this.transcribe(audioData);

      // TODO: Parse detailed recognition results from Aliyun response
      // This is a simplified placeholder

      logger.info('Retrieved detailed recognition results');

      return [];
    } catch (error) {
      logger.error('Failed to get detailed recognition', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const aliyunSTTService = new AliyunSTTService();
