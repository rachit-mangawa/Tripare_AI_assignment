import { redis } from './client';
import { DeduplicatedHotel } from '../types/hotel';

const CACHE_TTL_SECONDS = 3600; // 1 hour

function getCityKey(city: string): string {
  return `hotels:city:${city.toLowerCase()}`;
}

export async function saveHotelsToRedis(
  city: string,
  hotels: DeduplicatedHotel[]
): Promise<void> {
  try {
    const key = getCityKey(city);
    const pipeline = redis.pipeline();
    pipeline.del(key);

    for (const hotel of hotels) {
      pipeline.zadd(key, hotel.price, JSON.stringify(hotel));
    }

    pipeline.expire(key, CACHE_TTL_SECONDS);
    await pipeline.exec();
  } catch (err: any) {
    console.warn(`[Redis] Skip cache write (Redis unavailable): ${err.message}`);
  }
}

export async function getHotelsFromRedis(
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<DeduplicatedHotel[]> {
  try {
    const key = getCityKey(city);
    const min = minPrice !== undefined ? minPrice : '-inf';
    const max = maxPrice !== undefined ? maxPrice : '+inf';

    const rawHotels = await redis.zrangebyscore(key, min, max);
    return rawHotels.map((item) => JSON.parse(item) as DeduplicatedHotel);
  } catch (err: any) {
    console.warn(`[Redis] Skip cache read (Redis unavailable): ${err.message}`);
    return [];
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}
