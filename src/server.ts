import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { startWorker } from './temporal/worker';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Hotel Offer Orchestrator running on http://localhost:${PORT}`);
  // Attempt to boot background Temporal worker
  startWorker().catch(() => {});
});
