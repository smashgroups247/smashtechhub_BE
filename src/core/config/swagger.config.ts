import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express Enterprise API',
    version: '1.0.0',
    description: 'A well-structured Express.js API with TypeScript',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api.production.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/api/v1/routes/*.ts',
    './src/api/v1/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);