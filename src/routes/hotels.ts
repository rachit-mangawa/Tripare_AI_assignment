import { Router, Request, Response } from 'express';
import { executeHotelOrchestration } from '../temporal/client';
import { getHotelsFromRedis } from '../redis/hotelStore';

export const hotelsRouter = Router();

hotelsRouter.get('/hotels', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: 'Query param "city" is required' });
    }

    const minPriceParam = req.query.minPrice as string | undefined;
    const maxPriceParam = req.query.maxPrice as string | undefined;

    const hasPriceFilter = minPriceParam !== undefined || maxPriceParam !== undefined;

    if (hasPriceFilter) {
      const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
      const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;

      // Check if hotels are already cached in Redis
      let hotels = await getHotelsFromRedis(city, minPrice, maxPrice);

      // If Redis has no data for this city yet, trigger orchestration
      if (hotels.length === 0) {
        const orchestrated = await executeHotelOrchestration(city);
        hotels = await getHotelsFromRedis(city, minPrice, maxPrice);

        // Fallback filter in memory if Redis is offline during local dev
        if (hotels.length === 0 && orchestrated.length > 0) {
          hotels = orchestrated.filter((h) => {
            if (minPrice !== undefined && h.price < minPrice) return false;
            if (maxPrice !== undefined && h.price > maxPrice) return false;
            return true;
          });
        }
      }

      return res.json(hotels);
    }

    // Standard call: Orchestrate via Temporal, dedupe, save to Redis and return
    const deduplicatedHotels = await executeHotelOrchestration(city);
    return res.json(deduplicatedHotels);
  } catch (error: any) {
    console.error(`[Hotels API] Error handling request: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error processing hotels' });
  }
});
