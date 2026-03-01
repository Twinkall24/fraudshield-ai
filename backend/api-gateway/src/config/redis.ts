import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Pub/Sub instances (separate connections)
export const redisPub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export default redisClient;