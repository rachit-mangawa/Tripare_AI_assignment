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
  const key = getCityKey(city);

  const pipeline = redis.pipeline();
  // Clear old city entries first
  pipeline.del(key);

  for (const hotel of hotels) {
    // Store JSON as member and price as score for native Redis range filtering
    pipeline.zadd(key, hotel.price, JSON.stringify(hotel));
  }

  pipeline.expire(key, CACHE_TTL_SECONDS);
  await pipeline.exec();
}

export async function getHotelsFromRedis(
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<DeduplicatedHotel[]> {
  const key = getCityKey(city);

  const min = minPrice !== undefined ? minPrice : '-inf';
  const max = maxPrice !== undefined ? maxPrice : '+inf';

  // Use Redis ZRANGEBYSCORE to filter by price directly inside Redis
  const rawHotels = await redis.zrangebyscore(key, min, max);

  return rawHotels.map((item) => JSON.parse(item) as DeduplicatedHotel);
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const res = await redis.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
}
