export interface SupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface DeduplicatedHotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}
