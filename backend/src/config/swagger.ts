import swaggerJsDoc from 'swagger-jsdoc';
import { config } from './index';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BetterMe API',
      version: '1.0.0',
      description: 'API documentation for BetterMe application',
      contact: {
        name: 'BetterMe Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: 'Development server',
      },
      {
        url: config.server.isProduction ? config.server.apiUrl : `http://localhost:${config.server.port}`,
        description: config.server.isProduction ? 'Production server' : 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const specs = swaggerJsDoc(options);
