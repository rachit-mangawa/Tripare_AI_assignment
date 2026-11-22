import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { SupplierHotel, DeduplicatedHotel } from '../types/hotel';

const { fetchSupplierA, fetchSupplierB, persistHotelsInRedis } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
    retry: {
      initialInterval: '500 milliseconds',
      maximumAttempts: 3,
    },
  });

export async function hotelOrchestratorWorkflow(
  city: string
): Promise<DeduplicatedHotel[]> {
  // 1. Call Supplier A and Supplier B in parallel
  const [listA, listB] = await Promise.all([
    fetchSupplierA(city),
    fetchSupplierB(city),
  ]);

  // 2. Deduplicate by name and pick lower price
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

  // 3. Persist in Redis
  await persistHotelsInRedis(city, deduplicated);

  return deduplicated;
}
