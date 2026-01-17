import Redis from 'ioredis';
import { err, ok, Result } from 'neverthrow';
import type { Camera, CameraStatus } from '@/core/types/camera/camera';
import { unknownToError } from '@/lib/errors';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

const CAMERA_KEY_PREFIX = 'camera:';
const CAMERAS_LIST_KEY = 'cameras:list';

function getCameraKey(id: string): string {
  return `${CAMERA_KEY_PREFIX}${id}`;
}

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_CONFIG);
  }
  return redisClient;
}

export async function saveCamera(camera: Camera): Promise<Result<void, Error>> {
  try {
    const client = getRedisClient();
    const key = getCameraKey(camera.id);

    const cameraData = {
      ...camera,
      createdAt: camera.createdAt.toISOString(),
      updatedAt: camera.updatedAt.toISOString(),
    };

    await client.set(key, JSON.stringify(cameraData));
    await client.sadd(CAMERAS_LIST_KEY, camera.id);

    return ok(undefined);
  } catch (error) {
    return err(unknownToError(error, 'Failed to save camera'));
  }
}

export async function getCamera(id: string): Promise<Result<Camera, Error>> {
  try {
    const client = getRedisClient();
    const key = getCameraKey(id);

    const data = await client.get(key);
    if (!data) {
      return err(new Error(`Camera with id ${id} not found`));
    }

    const parsed = JSON.parse(data) as {
      id: string;
      name: string;
      location?: string;
      rtspUrl: string;
      status: CameraStatus;
      createdAt: string;
      updatedAt: string;
    };

    const camera: Camera = {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };

    return ok(camera);
  } catch (error) {
    return err(unknownToError(error, 'Failed to get camera'));
  }
}

export async function getAllCameras(): Promise<Result<Camera[], Error>> {
  try {
    const client = getRedisClient();
    const cameraIds = await client.smembers(CAMERAS_LIST_KEY);

    if (cameraIds.length === 0) {
      return ok([]);
    }

    const cameras: Camera[] = [];

    for (const id of cameraIds) {
      const result = await getCamera(id);
      if (result.isOk()) {
        cameras.push(result.value);
      }
    }

    return ok(cameras);
  } catch (error) {
    return err(unknownToError(error, 'Failed to get all cameras'));
  }
}

export async function deleteCamera(id: string): Promise<Result<void, Error>> {
  try {
    const client = getRedisClient();
    const key = getCameraKey(id);

    await client.del(key);
    await client.srem(CAMERAS_LIST_KEY, id);

    return ok(undefined);
  } catch (error) {
    return err(unknownToError(error, 'Failed to delete camera'));
  }
}

export async function updateCameraStatus(
  id: string,
  status: CameraStatus,
): Promise<Result<void, Error>> {
  try {
    const result = await getCamera(id);
    if (result.isErr()) {
      return err(result.error);
    }

    const camera = result.value;
    camera.status = status;
    camera.updatedAt = new Date();

    const saveResult = await saveCamera(camera);
    if (saveResult.isErr()) {
      return saveResult;
    }

    return ok(undefined);
  } catch (error) {
    return err(unknownToError(error, 'Failed to update camera status'));
  }
}
