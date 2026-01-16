import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config, validateConfig } from './config';
import { specs } from './config/swagger';
import { logger } from './utils/logger';
import routes from './routes';

// Validate configuration
validateConfig();

// Create Express application
const app: Application = express();

/**
 * Middleware Configuration
 */

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.server.isProduction
    ? config.frontend.url
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://154.9.252.164:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (!config.server.isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

/**
 * API Routes
 */
// Swagger documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
  },
}));

app.use('/api', routes);

/**
 * Root route
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Master Trainer API',
    version: '1.0.0',
    description: 'AI Sales Training and Coaching System',
    documentation: '/api/health',
  });
});

/**
 * 404 Handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

/**
 * Error Handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: config.server.isProduction
      ? 'Internal server error'
      : err.message,
  });
});

export default app;

