import { Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { sessionManager } from '../services/sessionManager';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Socket.io event handlers for real-time communication
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Authenticate socket connection using JWT
 */
export async function handleConnection(socket: AuthenticatedSocket): Promise<void> {
  try {
    // Extract token from handshake headers
    let token = socket.handshake.headers.authorization?.split(' ')[1];

    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, curr) => {
        const [key, value] = curr.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['token']; // Matches 'token=' in your logs
    }

    if (!token) {
      socket.emit('error', { message: 'Missing authentication token' });
      socket.disconnect();
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    socket.userId = decoded.userId;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      socket.emit('error', { message: 'User not found' });
      socket.disconnect();
      return;
    }

    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.userId,
    });

    socket.emit('connected', { message: 'Connected to real-time server' });
  } catch (error) {
    logger.error('Socket authentication failed', { error });
    socket.emit('error', { message: 'Authentication failed' });
    socket.disconnect();
  }
}

/**
 * Start a real-time roleplay session
 */
export async function handleStartSession(
  socket: AuthenticatedSocket,
  data: { sessionId: string; scenarioId: string }
): Promise<void> {
  try {
    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { sessionId, scenarioId } = data;

    // Verify session exists and belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: socket.userId,
        scenarioId,
      },
    });

    if (!session) {
      socket.emit('error', { message: 'Session not found or unauthorized' });
      return;
    }

    // Create realtime session
    const realtimeSession = await sessionManager.createSession(
      sessionId,
      socket.userId,
      scenarioId,
      socket
    );

    // Join socket to room for this session
    socket.join(`session:${sessionId}`);

    logger.info('Realtime session started', {
      sessionId,
      userId: socket.userId,
      scenarioId,
    });

    socket.emit('session-started', {
      sessionId,
      maxTurns: realtimeSession.maxTurns,
      buyerPersona: realtimeSession.buyerPersona,
      audioConfig: {
        sampleRate: 16000,
        channels: 1,
        format: 'pcm',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to start session', { error });
    socket.emit('error', { message: 'Failed to start session' });
  }
}

/**
 * Handle incoming audio chunk
 */
export async function handleAudioChunk(
  socket: AuthenticatedSocket,
  data: { sessionId: string; audioData: string; offset: number; totalChunks: number }
): Promise<void> {
  console.log("(handlers - handleAudioChunk called with:", data.sessionId, data.audioData.length);
  try {
    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { sessionId, audioData } = data;

    // Verify session exists
    const session = sessionManager.getSession(sessionId);
    if (!session || session.userId !== socket.userId) {
      socket.emit('error', { message: 'Invalid session' });
      return;
    }

    // Convert base64 string to Buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Handle audio chunk
    await sessionManager.handleAudioChunk(sessionId, audioBuffer);
  } catch (error) {
    logger.error('Failed to handle audio chunk', { error });
    socket.emit('error', { message: 'Failed to process audio' });
  }
}

/**
 * Handle manual session end
 */
export async function handleEndSession(
  socket: AuthenticatedSocket,
  data: { sessionId: string }
): Promise<void> {
  console.log("handleEndSession called with:", data.sessionId);
  try {
    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { sessionId } = data;

    // Verify session exists
    const session = sessionManager.getSession(sessionId);
    if (!session || session.userId !== socket.userId) {
      socket.emit('error', { message: 'Invalid session' });
      return;
    }
    console.log("Ending session:", sessionId);
    await sessionManager.endSession(sessionId, 'user_ended');
    socket.leave(`session:${sessionId}`);

    logger.info('Session ended by user', { sessionId, userId: socket.userId });
  } catch (error) {
    logger.error('Failed to end session', { error });
    socket.emit('error', { message: 'Failed to end session' });
  }
}

/**
 * Handle client disconnect
 */
export async function handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
  try {
    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId: socket.userId,
    });

    // No active sessions to clean up - handled by client initiating end
  } catch (error) {
    logger.error('Error handling disconnect', { error });
  }
}

/**
 * Handle heartbeat/ping
 */
export async function handlePing(socket: AuthenticatedSocket): Promise<void> {
  socket.emit('pong');
}

/**
 * Register all socket event handlers
 */
export function registerSocketHandlers(io: any): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    handleConnection(socket);

    // Roleplay events
    socket.on('start-session', (data) => handleStartSession(socket, data));
    socket.on('audio-chunk', (data) => handleAudioChunk(socket, data));
    socket.on('end-session', (data) => handleEndSession(socket, data));
    socket.on('ping', () => handlePing(socket));

    // Disconnect handler
    socket.on('disconnect', () => handleDisconnect(socket));
  });
}
