import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/core/config/swagger.config';

export const docsRouter = Router();

// Swagger UI
docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation',
}));

// JSON endpoint for OpenAPI spec
docsRouter.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});