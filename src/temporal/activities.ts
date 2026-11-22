import { SupplierHotel, DeduplicatedHotel } from '../types/hotel';
import { saveHotelsToRedis as saveToRedis } from '../redis/hotelStore';

const BASE_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:3000';

async function fetchSupplier(
  endpoint: string,
  city: string
): Promise<SupplierHotel[]> {
  const url = `${BASE_URL}${endpoint}?city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Supplier request failed with status ${res.status}`);
  }
  return (await res.json()) as SupplierHotel[];
}

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  try {
    return await fetchSupplier('/supplierA/hotels', city);
  } catch (err: any) {
    console.error(`[Activity] Supplier A error: ${err.message}`);
    // If supplier A is down, return empty array so workflow can still proceed with Supplier B
    return [];
  }
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  try {
    return await fetchSupplier('/supplierB/hotels', city);
  } catch (err: any) {
    console.error(`[Activity] Supplier B error: ${err.message}`);
    // If supplier B is down, return empty array so workflow can still proceed with Supplier A
    return [];
  }
}

export async function persistHotelsInRedis(
  city: string,
  hotels: DeduplicatedHotel[]
): Promise<void> {
  try {
    await saveToRedis(city, hotels);
  } catch (err: any) {
    console.warn(`[Activity] Could not write to Redis: ${err.message}`);
  }
}
