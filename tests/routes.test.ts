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
});
