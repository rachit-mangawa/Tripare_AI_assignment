import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from '../src/app';
import { redis } from '../src/redis/client';

let server: http.Server;
let baseUrl: string;

describe('API Routes Integration', () => {
  before(() => {
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    try {
      redis.disconnect();
    } catch {}
  });

  test('GET /supplierA/hotels returns list with city filter', async () => {
    const res = await fetch(`${baseUrl}/supplierA/hotels?city=delhi`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any[];
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.strictEqual(data[0].city, 'delhi');
  });

  test('GET /supplierB/hotels returns list with city filter', async () => {
    const res = await fetch(`${baseUrl}/supplierB/hotels?city=delhi`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any[];
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.strictEqual(data[0].city, 'delhi');
  });

  test('GET /health returns supplier and redis status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any;
    assert.ok(data.suppliers);
    assert.strictEqual(data.suppliers.supplierA, 'UP');
    assert.strictEqual(data.suppliers.supplierB, 'UP');
  });

  test('GET /api/hotels returns deduplicated hotel list for valid city', async () => {
    const res = await fetch(`${baseUrl}/api/hotels?city=delhi`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any[];
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);

    // Holtin should pick Supplier B (cheaper: 5340 vs 6000)
    const holtin = data.find((h) => h.name === 'Holtin');
    assert.ok(holtin);
    assert.strictEqual(holtin.price, 5340);
    assert.strictEqual(holtin.supplier, 'Supplier B');

    // Radison should pick Supplier A (cheaper: 5900 vs 6200)
    const radison = data.find((h) => h.name === 'Radison');
    assert.ok(radison);
    assert.strictEqual(radison.price, 5900);
    assert.strictEqual(radison.supplier, 'Supplier A');
  });

  test('GET /api/hotels filters by price range', async () => {
    const res = await fetch(`${baseUrl}/api/hotels?city=delhi&minPrice=5000&maxPrice=5500`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any[];
    assert.ok(Array.isArray(data));
    for (const h of data) {
      assert.ok(h.price >= 5000 && h.price <= 5500);
    }
  });

  test('GET /api/hotels returns empty array for city with no results', async () => {
    const res = await fetch(`${baseUrl}/api/hotels?city=atlantis`);
    assert.strictEqual(res.status, 200);
    const data = (await res.json()) as any[];
    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 0);
  });

  test('GET /api/hotels returns 400 when city param is missing', async () => {
    const res = await fetch(`${baseUrl}/api/hotels`);
    assert.strictEqual(res.status, 400);
  });
});
