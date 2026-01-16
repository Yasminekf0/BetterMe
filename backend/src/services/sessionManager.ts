import { logger } from '../utils/logger';
import { aiService } from './aiService';
import { aliyunSTTService } from './aliyunSTTService';
import { prisma } from '../lib/prisma';
import { Socket } from 'socket.io';

/**
 * Audio Configuration
 */
interface AudioConfig {
  sampleRate: number;
  channels: number;
  format: 'wav' | 'pcm';
}

/**
 * Realtime Session Data
 */
interface RealtimeSession {
  sessionId: string;
  userId: string;
  scenarioId: string;
  socket: Socket;
  audioBuffer: Buffer[];
  totalAudioSize: number;
  isProcessing: boolean;
  turnCount: number;
  maxTurns: number;
  buyerPersona: Record<string, unknown>;
  conversationHistory: Array<{ role: string; content: string }>;
  startTime: number;
  lastActivityTime: number;
}

/**
 * Session Manager - Orchestrates real-time communication
 * Handles audio streaming, speech-to-text, and AI responses
 */
class SessionManager {
  private sessions: Map<string, RealtimeSession> = new Map();
  private audioConfig: AudioConfig = {
    sampleRate: 16000,
    channels: 1,
    format: 'pcm',
  };

  // Maximum audio buffer size before processing (in bytes)
  private MAX_AUDIO_BUFFER_SIZE = 32000; // ~2 seconds at 16kHz

  // Session timeout (30 minutes)
  private SESSION_TIMEOUT = 30 * 60 * 1000;

  // Chunk timeout for STT (2 seconds of silence)
  private CHUNK_TIMEOUT = 2000;

  constructor() {
    // Cleanup stale sessions periodically
    setInterval(() => this.cleanupStaleSessions(), 60000);
  }

  /**
   * Create a new realtime session
   */
  async createSession(
    sessionId: string,
    userId: string,
    scenarioId: string,
    socket: Socket
  ): Promise<RealtimeSession> {
    try {
      // Get scenario details
      const scenario = await prisma.scenario.findUnique({
        where: { id: scenarioId },
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      const session: RealtimeSession = {
        sessionId,
        userId,
        scenarioId,
        socket,
        audioBuffer: [],
        totalAudioSize: 0,
        isProcessing: false,
        turnCount: 0,
        maxTurns: scenario.maxTurns || 8,
        buyerPersona: scenario.buyerPersona as Record<string, unknown>,
        conversationHistory: [],
        startTime: Date.now(),
        lastActivityTime: Date.now(),
      };

      this.sessions.set(sessionId, session);
      logger.info('Session created', {
        sessionId,
        userId,
        scenarioId,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create session', { error });
      throw error;
    }
  }

  /**
   * Get an active session
   */
  getSession(sessionId: string): RealtimeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Handle incoming audio chunk
   * Buffers audio and triggers STT when buffer is full or on timeout
   */
  async handleAudioChunk(sessionId: string, audioData: Buffer): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      logger.warn('Audio chunk received for non-existent session', { sessionId });
      return;
    }

    try {
      session.audioBuffer.push(audioData);
      session.totalAudioSize += audioData.length;
      session.lastActivityTime = Date.now();

      // Process when buffer is full
      if (session.totalAudioSize >= this.MAX_AUDIO_BUFFER_SIZE) {
        await this.processAudioBuffer(sessionId);
      }
    } catch (error) {
      logger.error('Failed to handle audio chunk', { sessionId, error });
      session.socket.emit('error', {
        message: 'Failed to process audio',
        type: 'AUDIO_PROCESSING_ERROR',
      });
    }
  }

  /**
   * Process accumulated audio buffer
   * Sends to Aliyun STT and processes response
   */
  private async processAudioBuffer(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session || session.isProcessing || session.audioBuffer.length === 0) {
      return;
    }

    try {
      session.isProcessing = true;

      // Combine all audio chunks
      const combinedAudio = Buffer.concat(session.audioBuffer);
      session.audioBuffer = [];
      session.totalAudioSize = 0;

      // Emit progress to client
      session.socket.emit('audio-received', {
        audioSize: combinedAudio.length,
        timestamp: Date.now(),
      });

      // Send to Aliyun STT (placeholder - implement with actual Aliyun SDK)
      const transcribedText = await this.transcribeAudio(combinedAudio, sessionId);

      if (!transcribedText || transcribedText.trim().length === 0) {
        logger.info('Empty transcription', { sessionId });
        session.isProcessing = false;
        return;
      }

      // Log user message
      await prisma.message.create({
        data: {
          sessionId,
          role: 'USER',
          content: transcribedText,
        },
      });

      // Add to conversation history
      session.conversationHistory.push({
        role: 'user',
        content: transcribedText,
      });

      // Emit transcribed text to client
      session.socket.emit('transcription', {
        text: transcribedText,
        timestamp: Date.now(),
      });

      // Generate AI response
      await this.generateAIResponse(sessionId);
    } catch (error) {
      logger.error('Failed to process audio buffer', { sessionId, error });
      session.socket.emit('error', {
        message: 'Failed to process audio',
        type: 'STT_ERROR',
      });
    } finally {
      session.isProcessing = false;
    }
  }

  /**
   * Transcribe audio using Aliyun STT
   */
  private async transcribeAudio(audioData: Buffer, sessionId: string): Promise<string> {
    try {
      logger.info('Sending audio to Aliyun STT', {
        sessionId,
        audioSize: audioData.length,
      });

      const result = await aliyunSTTService.transcribe(audioData, {
        language: 'zh-CN',
        punctuation: true,
        modelName: 'general',
      });

      logger.info('Aliyun STT response received', {
        sessionId,
        text: result.text,
        confidence: result.confidence,
      });

      return result.text;
    } catch (error) {
      logger.error('Aliyun STT error', { sessionId, error });
      throw error;
    }
  }

  /**
   * Generate AI response based on conversation history
   */
  private async generateAIResponse(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }

    try {
      const buyerPersona = session.buyerPersona as Record<string, unknown>;
      const systemPrompt = `You are playing ${buyerPersona.name}, ${buyerPersona.role} at ${buyerPersona.company}. 
${buyerPersona.background}. Your personality: ${buyerPersona.personality}.
Keep responses natural and concise (1-3 sentences). Show appropriate objections or interests based on the sales rep's pitch.`;

      // Build messages array for AI
      const messages = [
        { role: 'system', content: systemPrompt },
        ...session.conversationHistory,
      ];

      logger.info('Generating AI response', { sessionId, turnCount: session.turnCount });

      // Get AI response
      const aiResponse = await aiService.chatCompletion(
        messages as any,
        {
          temperature: 0.8,
          maxTokens: 200,
        }
      );

      // Save AI response to database
      await prisma.message.create({
        data: {
          sessionId,
          role: 'AI',
          content: aiResponse,
        },
      });

      // Add to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
      });

      session.turnCount++;

      // Emit AI response to client
      session.socket.emit('ai-response', {
        text: aiResponse,
        turnCount: session.turnCount,
        maxTurns: session.maxTurns,
        timestamp: Date.now(),
      });

      // Generate avatar audio/video response (TODO)
      await this.generateAvatarResponse(sessionId, aiResponse);

      // Check if session should end
      if (session.turnCount >= session.maxTurns) {
        session.socket.emit('session-ending', {
          reason: 'max_turns_reached',
          totalTurns: session.turnCount,
        });
      }
    } catch (error) {
      logger.error('Failed to generate AI response', { sessionId, error });
      session.socket.emit('error', {
        message: 'Failed to generate response',
        type: 'AI_RESPONSE_ERROR',
      });
    }
  }

  /**
   * Generate avatar audio/video response
   * TODO: Implement with video generation service
   */
  private async generateAvatarResponse(sessionId: string, text: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }

    try {
      // TODO: Implement avatar generation
      // Options:
      // 1. Aliyun AI Service
      // 2. ElevenLabs for TTS
      // 3. D-ID or similar for video generation
      // 4. Stream pre-recorded avatar videos

      logger.info('Generating avatar response', { sessionId, textLength: text.length });

      // Placeholder: Emit mock video URL
      session.socket.emit('avatar-response', {
        videoUrl: '/api/videos/placeholder.mp4',
        audioUrl: '/api/audio/placeholder.mp3',
        duration: 3000, // milliseconds
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to generate avatar response', { sessionId, error });
      // Don't throw - avatar is optional, conversation can continue
    }
  }

  /**
   * End a session gracefully
   */
  async endSession(sessionId: string, reason: string = 'normal'): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }

    try {
      // Calculate session duration
      const duration = Date.now() - session.startTime;

      logger.info('Session ended', {
        sessionId,
        userId: session.userId,
        scenarioId: session.scenarioId,
        turnCount: session.turnCount,
        duration,
        reason,
      });

      // Update session in database
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Notify client
      session.socket.emit('session-ended', {
        reason,
        totalTurns: session.turnCount,
        duration,
      });

      // Remove session
      this.sessions.delete(sessionId);
    } catch (error) {
      logger.error('Failed to end session', { sessionId, error });
    }
  }

  /**
   * Force end a session (e.g., timeout or error)
   */
  async forceEndSession(sessionId: string, reason: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }

    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'ABANDONED',
          completedAt: new Date(),
        },
      });

      session.socket.emit('session-force-ended', { reason });
      this.sessions.delete(sessionId);

      logger.warn('Session force ended', { sessionId, reason });
    } catch (error) {
      logger.error('Failed to force end session', { sessionId, error });
    }
  }

  /**
   * Handle client disconnect
   */
  async handleDisconnect(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    if (!session) {
      return;
    }

    try {
      // Check if session is in progress
      const dbSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (dbSession && dbSession.status === 'ACTIVE') {
        await this.forceEndSession(sessionId, 'client_disconnect');
      } else {
        this.sessions.delete(sessionId);
      }

      logger.info('Client disconnected', { sessionId });
    } catch (error) {
      logger.error('Failed to handle disconnect', { sessionId, error });
    }
  }

  /**
   * Cleanup stale sessions
   */
  private cleanupStaleSessions(): void {
    const now = Date.now();
    const staleSessionIds: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivityTime > this.SESSION_TIMEOUT) {
        staleSessionIds.push(sessionId);
      }
    });

    staleSessionIds.forEach((sessionId) => {
      this.forceEndSession(sessionId, 'timeout');
    });

    if (staleSessionIds.length > 0) {
      logger.info('Cleaned up stale sessions', { count: staleSessionIds.length });
    }
  }

  /**
   * Get session statistics
   */
  getStats(): {
    activeSessions: number;
    totalMemory: number;
  } {
    let totalMemory = 0;
    this.sessions.forEach((session) => {
      totalMemory += session.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    });

    return {
      activeSessions: this.sessions.size,
      totalMemory,
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
