// src/api/v1/docs/swagger.ts
import { Express, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/core/config/env';

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
          message: {
            type: 'string',
            example: 'Error message',
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
      name: 'Health',
      description: 'Health check endpoints',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [
    './src/api/v1/routes/*.ts',
    './src/api/v1/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
      `,
      customSiteTitle: 'API Documentation',
      customfavIcon: '/favicon.ico',
    })
  );

  // Scalar (Modern alternative to Swagger UI)
  // Uncomment after installing: npm install @scalar/express-api-reference
  /*
  import { apiReference } from '@scalar/express-api-reference';
  
  app.use('/api/docs/scalar', (req: Request, res: Response) => {
    return apiReference({
      spec: {
        content: swaggerSpec,
      },
      theme: 'purple',
      darkMode: true,
      layout: 'modern',
      showSidebar: true,
    })(req, res);
  });
  */

  // OpenAPI JSON endpoint
  app.get('/api/docs/json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};