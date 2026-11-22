import { Connection, Client } from '@temporalio/client';
import { hotelOrchestratorWorkflow } from './workflows';
import { fetchSupplierA, fetchSupplierB, persistHotelsInRedis } from './activities';
import { DeduplicatedHotel, SupplierHotel } from '../types/hotel';

export const TASK_QUEUE_NAME = 'hotel-orchestrator-queue';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || '127.0.0.1:7233';

let temporalClient: Client | null = null;

export async function getTemporalClient(): Promise<Client | null> {
  if (temporalClient) return temporalClient;

  try {
    const connection = await Connection.connect({
      address: TEMPORAL_ADDRESS,
      connectTimeout: 2000,
    });
    temporalClient = new Client({ connection });
    return temporalClient;
  } catch (err: any) {
    console.warn(`[Temporal Client] Temporal server offline (${err.message}). Using local fallback.`);
    return null;
  }
}

// Fallback logic if Temporal server is not currently running locally
async function runLocalFallback(city: string): Promise<DeduplicatedHotel[]> {
  const [listA, listB] = await Promise.all([
    fetchSupplierA(city),
    fetchSupplierB(city),
  ]);

  const hotelMap = new Map<string, DeduplicatedHotel>();
  const mergeHotel = (item: SupplierHotel, supplierName: string) => {
    const key = item.name.trim();
    const existing = hotelMap.get(key);
    if (!existing || item.price < existing.price) {
      hotelMap.set(key, {
        name: item.name,
        price: item.price,
        supplier: supplierName,
        commissionPct: item.commissionPct,
      });
    }
  };

  for (const h of listA) mergeHotel(h, 'Supplier A');
  for (const h of listB) mergeHotel(h, 'Supplier B');

  const deduplicated = Array.from(hotelMap.values());
  await persistHotelsInRedis(city, deduplicated);
  return deduplicated;
}

export async function executeHotelOrchestration(
  city: string
): Promise<DeduplicatedHotel[]> {
  const client = await getTemporalClient();

  if (client) {
    const workflowId = `hotel-orchestration-${city.toLowerCase()}-${Date.now()}`;
    const handle = await client.workflow.start(hotelOrchestratorWorkflow, {
      taskQueue: TASK_QUEUE_NAME,
      workflowId,
      args: [city],
    });
    return await handle.result();
  }

  // Graceful execution if Temporal engine is offline
  return runLocalFallback(city);
}
