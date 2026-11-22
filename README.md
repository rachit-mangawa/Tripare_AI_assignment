# Hotel Offer Orchestrator

Backend service that queries two hotel suppliers concurrently, deduplicates listings by name, picks the best rate, and stores the results in Redis with sorted-set price filtering, orchestrated using Temporal.io.

## Tech Stack

- **Runtime:** Node.js (v20+ / v22+), TypeScript
- **Framework:** Express.js
- **Orchestration:** Temporal.io (`@temporalio/client`, `@temporalio/workflow`, `@temporalio/activity`, `@temporalio/worker`)
- **Cache & Filtering:** Redis (ioredis) using sorted sets (`ZADD`, `ZRANGEBYSCORE`)
- **Containers:** Docker & Docker Compose

---

## Architecture Flow

```
                  +----------------------------------+
                  |  GET /api/hotels?city=delhi     |
                  +-----------------+----------------+
                                    |
                                    v
                     +--------------+---------------+
                     | Temporal Workflow Fan-out    |
                     +--------------+---------------+
                                    |
                    +---------------+---------------+
                    |                               |
                    v                               v
        +-----------+-----------+       +-----------+-----------+
        | Supplier A Activity   |       | Supplier B Activity   |
        +-----------+-----------+       +-----------+-----------+
                    |                               |
                    +---------------+---------------+
                                    |
                                    v
                     +--------------+---------------+
                     | Deduplicate & Select Best    |
                     | Cheaper price wins per hotel |
                     +--------------+---------------+
                                    |
                                    v
                     +--------------+---------------+
                     | Store in Redis (Sorted Set)  |
                     | Score = Price, Value = JSON  |
                     +--------------+---------------+
                                    |
                                    v
                     +--------------+---------------+
                     | Return JSON to client        |
                     +------------------------------+
```

---

## Endpoints

### 1. Main Endpoints

* `GET /api/hotels?city=delhi`
  Orchestrates parallel supplier calls, deduplicates, caches in Redis, and returns the best rates.

* `GET /api/hotels?city=delhi&minPrice=5000&maxPrice=6000`
  Queries Redis sorted set using native `ZRANGEBYSCORE` to filter by price range directly inside Redis.

### 2. Mock Supplier Endpoints

* `GET /supplierA/hotels?city=delhi`
* `GET /supplierB/hotels?city=delhi`

### 3. Health & Simulation Endpoints

* `GET /health`
  Reports health status of both mock suppliers and the Redis connection.

* `POST /supplier/simulate-down`
  Payload: `{"supplier": "A" | "B", "down": true | false}`
  Allows toggling mock supplier downtime to verify workflow resilience.

---

## Getting Started

### Option 1: Run with Docker Compose (Recommended)

Requires Docker Desktop or Docker engine.

```bash
# Build and start all services (App, Redis, Temporal dev-server)
docker compose up --build
```

- API server: `http://localhost:3000`
- Temporal Web UI: `http://localhost:8233`
- Redis: `localhost:6379`

To stop:
```bash
docker compose down
```

---

### Option 2: Run Locally (Standalone / Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Redis (local or Docker):**
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Start Temporal (optional local dev server):**
   ```bash
   temporal server start-dev
   ```

4. **Run the API server:**
   ```bash
   npm run dev
   ```

5. **Run test suite:**
   ```bash
   npm test
   ```

---

## Testing with Postman

Import `postman_collection.json` into Postman.

It includes 8 pre-configured requests:
1. `GET Hotels (Valid City with Overlaps)`
2. `GET Hotels (Price Filter via Redis)`
3. `GET Hotels (City with No Results)`
4. `GET Health Check (Bonus)`
5. `Mock Supplier A`
6. `Mock Supplier B`
7. `Simulate Supplier B Down`
8. `Restore Supplier B Up`
