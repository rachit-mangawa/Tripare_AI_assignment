import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 2) return null; // Stop retrying if Redis is offline
    return 300;
  },
});

redis.on('error', (err) => {
  // Silent log on connection attempt when local redis daemon is absent
});
