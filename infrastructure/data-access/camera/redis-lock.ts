import Redis from 'ioredis';
import { err, ok, Result } from 'neverthrow';
import { unknownToError } from '@/lib/errors';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

const LOCK_KEY_PREFIX = 'lock:camera:';
const DEFAULT_LOCK_TTL = 30;

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_CONFIG);
  }
  return redisClient;
}

function getLockKey(cameraId: string): string {
  return `${LOCK_KEY_PREFIX}${cameraId}`;
}

export async function acquireLock(
  cameraId: string,
  ttlSeconds: number = DEFAULT_LOCK_TTL,
): Promise<Result<string, Error>> {
  try {
    const client = getRedisClient();
    const lockKey = getLockKey(cameraId);
    const lockValue = `${Date.now()}-${Math.random()}`;

    const result = await client.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');

    if (result === 'OK') {
      return ok(lockValue);
    }

    return err(new Error(`Failed to acquire lock for camera ${cameraId}`));
  } catch (error) {
    return err(unknownToError(error, 'Failed to acquire lock'));
  }
}

export async function releaseLock(
  cameraId: string,
  lockValue: string,
): Promise<Result<void, Error>> {
  try {
    const client = getRedisClient();
    const lockKey = getLockKey(cameraId);

    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await client.eval(script, 1, lockKey, lockValue);

    return ok(undefined);
  } catch (error) {
    return err(unknownToError(error, 'Failed to release lock'));
  }
}

export async function withLock<T>(
  cameraId: string,
  operation: () => Promise<T>,
  ttlSeconds: number = DEFAULT_LOCK_TTL,
): Promise<Result<T, Error>> {
  const lockResult = await acquireLock(cameraId, ttlSeconds);

  if (lockResult.isErr()) {
    return err(lockResult.error);
  }

  const lockValue = lockResult.value;

  try {
    const result = await operation();
    await releaseLock(cameraId, lockValue);
    return ok(result);
  } catch (error) {
    await releaseLock(cameraId, lockValue);
    return err(unknownToError(error, 'Operation failed'));
  }
}

