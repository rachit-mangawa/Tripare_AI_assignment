import { Router, Request, Response } from 'express';
import { supplierAHotels, supplierBHotels } from './mockData';

export const supplierRouter = Router();

// Flag to simulate supplier downtime for testing if needed
let supplierADown = false;
let supplierBDown = false;

export function setSupplierDownStatus(supplier: 'A' | 'B', isDown: boolean): void {
  if (supplier === 'A') supplierADown = isDown;
  if (supplier === 'B') supplierBDown = isDown;
}

export function getSupplierStatus(): { supplierA: string; supplierB: string } {
  return {
    supplierA: supplierADown ? 'DOWN' : 'UP',
    supplierB: supplierBDown ? 'DOWN' : 'UP',
  };
}

supplierRouter.get('/supplierA/hotels', (req: Request, res: Response) => {
  if (supplierADown) {
    return res.status(503).json({ error: 'Supplier A temporarily unavailable' });
  }
  const city = (req.query.city as string)?.toLowerCase();
  const hotels = city
    ? supplierAHotels.filter((h) => h.city.toLowerCase() === city)
    : supplierAHotels;
  return res.json(hotels);
});

supplierRouter.get('/supplierB/hotels', (req: Request, res: Response) => {
  if (supplierBDown) {
    return res.status(503).json({ error: 'Supplier B temporarily unavailable' });
  }
  const city = (req.query.city as string)?.toLowerCase();
  const hotels = city
    ? supplierBHotels.filter((h) => h.city.toLowerCase() === city)
    : supplierBHotels;
  return res.json(hotels);
});

// Admin toggle endpoint to simulate supplier failure for testing
supplierRouter.post('/supplier/simulate-down', (req: Request, res: Response) => {
  const { supplier, down } = req.body;
  if (supplier === 'A' || supplier === 'B') {
    setSupplierDownStatus(supplier, Boolean(down));
    return res.json({ message: `Supplier ${supplier} down state set to ${Boolean(down)}` });
  }
  return res.status(400).json({ error: 'Supplier must be A or B' });
});
