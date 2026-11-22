import express from 'express';
import { supplierRouter } from './suppliers/routes';
import { hotelsRouter } from './routes/hotels';
import { healthRouter } from './routes/health';

export const app = express();

app.use(express.json());

// Mock supplier endpoints (/supplierA/hotels, /supplierB/hotels)
app.use(supplierRouter);

// Main orchestrator endpoint (/api/hotels)
app.use('/api', hotelsRouter);

// Health check endpoint (/health)
app.use(healthRouter);
