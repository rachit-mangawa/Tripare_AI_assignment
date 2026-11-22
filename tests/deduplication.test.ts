import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SupplierHotel, DeduplicatedHotel } from '../src/types/hotel';

function deduplicateHotels(listA: SupplierHotel[], listB: SupplierHotel[]): DeduplicatedHotel[] {
  const map = new Map<string, DeduplicatedHotel>();

  const process = (hotels: SupplierHotel[], supplier: string) => {
    for (const h of hotels) {
      const name = h.name.trim();
      const existing = map.get(name);
      if (!existing || h.price < existing.price) {
        map.set(name, {
          name: h.name,
          price: h.price,
          supplier,
          commissionPct: h.commissionPct,
        });
      }
    }
  };

  process(listA, 'Supplier A');
  process(listB, 'Supplier B');

  return Array.from(map.values());
}

describe('Hotel Offer Deduplication', () => {
  const supplierA: SupplierHotel[] = [
    { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    { hotelId: 'a3', name: 'Hyatt', price: 7400, city: 'delhi', commissionPct: 12 },
  ];

  const supplierB: SupplierHotel[] = [
    { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 15 },
    { hotelId: 'b3', name: 'Taj Palace', price: 9500, city: 'delhi', commissionPct: 22 },
  ];

  test('selects cheaper price when hotel appears in both suppliers', () => {
    const results = deduplicateHotels(supplierA, supplierB);

    const holtin = results.find((h) => h.name === 'Holtin');
    assert.ok(holtin);
    assert.strictEqual(holtin.price, 5340);
    assert.strictEqual(holtin.supplier, 'Supplier B');
    assert.strictEqual(holtin.commissionPct, 20);

    const radison = results.find((h) => h.name === 'Radison');
    assert.ok(radison);
    assert.strictEqual(radison.price, 5900);
    assert.strictEqual(radison.supplier, 'Supplier A');
    assert.strictEqual(radison.commissionPct, 13);
  });

  test('keeps hotel if only present in one supplier', () => {
    const results = deduplicateHotels(supplierA, supplierB);

    const hyatt = results.find((h) => h.name === 'Hyatt');
    assert.ok(hyatt);
    assert.strictEqual(hyatt.supplier, 'Supplier A');

    const taj = results.find((h) => h.name === 'Taj Palace');
    assert.ok(taj);
    assert.strictEqual(taj.supplier, 'Supplier B');
  });
});
