import publisher from '../publisher.js';

const CACHE_PREFIX = 'reports:';
const DEFAULT_TTL = 60;

export const getCache = async (key) => {
  try {
    const data = await publisher.get(`${CACHE_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    await publisher.setex(`${CACHE_PREFIX}${key}`, ttl, JSON.stringify(data));
  } catch {
  }
};

export const invalidateCache = async () => {
  try {
    const keys = await publisher.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await publisher.del(...keys);
    }
  } catch {
  }
};
