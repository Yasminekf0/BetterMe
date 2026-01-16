'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Audio Recorder Configuration
 */
export interface AudioRecorderConfig {
  sampleRate?: number;
  channels?: number;
  chunkInterval?: number; // milliseconds
  onChunk?: (audioData: Uint8Array) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for capturing audio using MediaRecorder API
 * Emits audio chunks at regular intervals
 */
export function useAudioRecorder(config: AudioRecorderConfig = {}) {
  const {
    sampleRate = 16000,
    channels = 1,
    chunkInterval = 250, // 250ms chunks
    onChunk,
    onError,
  } = config;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Start audio recording
   */
  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
        },
      });

      // Create audio context for volume monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      // Emit chunks at regular intervals
      const chunkData = () => {
        if (mediaRecorderRef.current?.state === 'recording' && chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          blob.arrayBuffer().then((buffer) => {
            if (onChunk) {
              onChunk(new Uint8Array(buffer));
            }
          });

          // Clear chunks for next interval
          chunks.length = 0;
        }

        // Schedule next chunk emission
        if (mediaRecorderRef.current?.state === 'recording') {
          chunkTimeoutRef.current = setTimeout(chunkData, chunkInterval);
        }
      };

      // Start chunk emission
      chunkTimeoutRef.current = setTimeout(chunkData, chunkInterval);

      // Monitor volume
      const monitorVolume = () => {
        if (analyserRef.current && mediaRecorderRef.current?.state === 'recording') {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setVolume(average / 255); // Normalize to 0-1

          requestAnimationFrame(monitorVolume);
        }
      };

      monitorVolume();

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);

      logger.info('Audio recording started', {
        sampleRate,
        channels,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);

      logger.error('Failed to start recording', { error: error.message });
    }
  }, [sampleRate, channels, chunkInterval, onChunk, onError]);

  /**
   * Stop audio recording
   */
  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        reject(new Error('Recording not started'));
        return;
      }

      try {
        const mediaRecorder = mediaRecorderRef.current;

        mediaRecorder.onstop = () => {
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());

          // Clear timeouts
          if (chunkTimeoutRef.current) {
            clearTimeout(chunkTimeoutRef.current);
          }

          setIsRecording(false);
          setVolume(0);

          logger.info('Audio recording stopped');
          resolve();
        };

        mediaRecorder.stop();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        reject(error);
      }
    });
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.stream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });

    setIsMuted(!isMuted);
  }, [isMuted]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }

      if (chunkTimeoutRef.current) {
        clearTimeout(chunkTimeoutRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, stopRecording]);

  return {
    isRecording,
    isMuted,
    volume,
    error,
    startRecording,
    stopRecording,
    toggleMute,
  };
}
