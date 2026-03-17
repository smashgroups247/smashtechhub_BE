// src/core/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SmashTechHub API',
    version: '1.0.0',
    description: 'A well-structured Express.js API with TypeScript for SmashTechHub platform',
    contact: {
      name: 'SmashTechHub Support',
      email: 'support@smashtechhub.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api.smashtechhub.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          statusCode: {
            type: 'number',
            example: 400,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          errors: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          statusCode: {
            type: 'number',
            example: 200,
          },
          message: {
            type: 'string',
            example: 'Success message',
          },
          data: {
            type: 'object',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication endpoints',
    },
    {
      name: 'Pricing',
      description: 'Pricing plans management endpoints',
    },
    {
      name: 'Contact',
      description: 'Contact form submissions management endpoints',
    },
    {
      name: 'Health',
      description: 'Health check endpoints',
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