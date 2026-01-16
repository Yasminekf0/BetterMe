'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { socketClient } from '@/lib/socketClient';
import { useAudioRecorder, AudioRecorderConfig } from './useAudioRecorder';
import { logger } from '@/lib/logger';

/**
 * Real-time Roleplay Session State
 */
export interface RealtimeSessionState {
  sessionId: string | null;
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  currentTranscription: string;
  aiResponse: string;
  turnCount: number;
  maxTurns: number;
  error: string | null;
  conversationHistory: Array<{
    role: 'user' | 'ai';
    text: string;
    timestamp: number;
  }>;
}

interface UseRealtimeRoleplayConfig extends AudioRecorderConfig {
  sessionId: string;
  scenarioId: string;
}

/**
 * Hook for managing real-time roleplay sessions
 * Integrates audio recording, WebSocket communication, and state management
 */
export function useRealtimeRoleplay(config: UseRealtimeRoleplayConfig) {
  const { sessionId, scenarioId, ...audioConfig } = config;
  const mediaRecorderRef = useRef(null);
  

  const [state, setState] = useState<RealtimeSessionState>({
    sessionId: null,
    isConnected: false,
    isRecording: false,
    isProcessing: false,
    currentTranscription: '',
    aiResponse: '',
    turnCount: 0,
    maxTurns: 0,
    error: null,
    conversationHistory: [],
  });

  const audioRecorder = useAudioRecorder({
    ...audioConfig,
    onChunk: (audioData) => {
      console.log("Audio chunk received of size:", audioData);
      handleAudioChunk(audioData);
    },
    onError: (error) => handleAudioError(error),
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  

  /**
   * Connect to WebSocket server
   */
  const connectSession = useCallback(async (data: any) => {
    try {
      console.log("any is here:", data);
      if (!socketClient.isConnected()) {
        await socketClient.connect();
      }
      console.log("Socket connected:", socketClient.isConnected());

      setState((prev) => ({ ...prev, isConnected: true, error: null }));
      
      // Set up event listeners
      setupSocketListeners();
      console.log("sending data is here:", {
        sessionId: data.sessionId,
        scenarioId: data.scenarioId,
      });
      // Start realtime session
      socketClient.emit('start-session', {
        sessionId: data.sessionId,
        scenarioId: data.scenarioId,
      });

      logger.info('Starting realtime session', { sessionId: data.sessionId, scenarioId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, error: message, isConnected: false }));

      logger.error('Failed to connect session', { error: message });
    }
  }, [sessionId, scenarioId]);


  /**
   * Setup Socket.io event listeners
   */
  const setupSocketListeners = useCallback(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    // Session started
    socket.on('session-started', (data) => {
      setState((prev) => ({
        ...prev,
        sessionId: data.sessionId,
        maxTurns: data.maxTurns,
      }));

      logger.info('Session started', { maxTurns: data.maxTurns });
    });

    // Transcription received
    socket.on('transcription', (data) => {
      setState((prev) => ({
        ...prev,
        currentTranscription: data.text,
        conversationHistory: [
          ...prev.conversationHistory,
          {
            role: 'user',
            text: data.text,
            timestamp: data.timestamp,
          },
        ],
      }));

      logger.info('Transcription received', { text: data.text });
    });

    // AI response received
    socket.on('ai-response', (data) => {
      setState((prev) => ({
        ...prev,
        aiResponse: data.text,
        turnCount: data.turnCount,
        isProcessing: false,
        conversationHistory: [
          ...prev.conversationHistory,
          {
            role: 'ai',
            text: data.text,
            timestamp: data.timestamp,
          },
        ],
      }));

      logger.info('AI response received', {
        text: data.text,
        turnCount: data.turnCount,
      });
    });

    // Avatar response (video/audio)
    socket.on('avatar-response', (data) => {
      logger.info('Avatar response available', {
        videoUrl: data.videoUrl,
        audioUrl: data.audioUrl,
        duration: data.duration,
      });

      // TODO: Play avatar video/audio
      // This would be handled by the consuming component
    });

    // Audio received confirmation
    socket.on('audio-received', (data) => {
      setState((prev) => ({ ...prev, isProcessing: true }));

      logger.info('Audio received by server', { audioSize: data.audioSize });
    });

    // Session ending warning
    socket.on('session-ending', (data) => {
      logger.warn('Session ending', { reason: data.reason });
    });

    // Session ended
    socket.on('session-ended', (data) => {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
      }));

      logger.info('Session ended', {
        reason: data.reason,
        totalTurns: data.totalTurns,
        duration: data.duration,
      });
    });

    // Force ended
    socket.on('session-force-ended', (data) => {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        isProcessing: false,
        error: `Session force ended: ${data.reason}`,
      }));

      logger.error('Session force ended', { reason: data.reason });
    });

    // Error
    socket.on('error', (data) => {
      setState((prev) => ({ ...prev, error: data.message }));

      logger.error('Socket error', { message: data.message, type: data.type });
    });
  }, []);

  /**
   * Handle audio chunk from MediaRecorder
   */
  const handleAudioChunk = useCallback((audioData: Uint8Array) => {
    if (!stateRef.current.isConnected) return;

    try {
      // Convert to base64 for transmission
      const audioBase64 = Buffer.from(audioData).toString('base64');
      console.debug(`sessionId: ${sessionId} and [Audio Stream] Sending chunk: ${(audioData.length / 1024).toFixed(2)} KB`);

      socketClient.emit('audio-chunk', {
        sessionId,
        audioData: audioBase64,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to send audio chunk', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [sessionId]);

  /**
   * Handle audio recorder error
   */
  const handleAudioError = useCallback((error: Error) => {
    setState((prev) => ({ ...prev, error: error.message }));
    logger.error('Audio recorder error', { message: error.message });
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      await audioRecorder.startRecording();
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [audioRecorder]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(async () => {
    try {
      await audioRecorder.stopRecording();
      setState((prev) => ({ ...prev, isRecording: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [audioRecorder]);

  /**
   * End session
   */
  const endSession = useCallback(() => {
    if (!state.sessionId) return;

    socketClient.emit('end-session', {
      sessionId: state.sessionId,
    });

    stopRecording();
  }, [state.sessionId, stopRecording]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (state.isRecording) {
        stopRecording();
      }
      if (state.isConnected) {
        socketClient.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    ...audioRecorder,
    connectSession,
    startRecording,
    stopRecording,
    endSession,
  };
}
