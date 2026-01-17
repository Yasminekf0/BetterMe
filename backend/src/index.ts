import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './socket/handlers';
import { initializeStorageConfigs } from './services/mediaService';

/**
 * Start the server with Socket.io support
 */
async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.server.isProduction
          ? config.frontend.url
          : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://154.9.252.164:3000'],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      // Performance tuning for real-time audio
      transports: ['websocket', 'polling'],
      serveClient: false,
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB for audio chunks
    });

    // Register socket event handlers
    registerSocketHandlers(io);

    // Initialize storage configurations / 初始化存储配置
    await initializeStorageConfigs();

    // Start server - bind to 0.0.0.0 for external access
    httpServer.listen(config.server.port, '0.0.0.0', () => {
      logger.info(`Server started with Socket.io`, {
        port: config.server.port,
        env: config.server.nodeEnv,
        url: `http://localhost:${config.server.port}`,
        socketIOEnabled: true,
      });
    });

    // Attach io to app for potential route handlers
    (app as any).io = io;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

// Start the server
startServer();

