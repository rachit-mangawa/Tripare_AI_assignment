import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { supplierRouter } from './suppliers/routes';
import { hotelsRouter } from './routes/hotels';
import { healthRouter } from './routes/health';
import { swaggerSpec } from './docs/swaggerSpec';

export const app = express();

app.use(express.json());

// API Documentation via Swagger UI
app.get('/openapi.json', (_req, res) => res.json(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mock supplier endpoints (/supplierA/hotels, /supplierB/hotels)
app.use(supplierRouter);

// Main orchestrator endpoint (/api/hotels)
app.use('/api', hotelsRouter);

// Health check endpoint (/health)
app.use(healthRouter);
