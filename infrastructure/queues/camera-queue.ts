import { Queue } from 'bullmq';
import type { RedisOptions } from 'ioredis';

const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export interface CameraCommand {
  action: 'start' | 'stop';
  cameraId: string;
}

export const cameraQueue = new Queue<CameraCommand>('cameras', {
  connection: REDIS_CONFIG,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});

export async function enqueueStartCamera(
  cameraId: string,
): Promise<{ jobId: string }> {
  const job = await cameraQueue.add('start-camera', {
    action: 'start',
    cameraId,
  });

  if (!job.id) {
    throw new Error('Failed to create job: job ID is missing');
  }

  return { jobId: job.id };
}

export async function enqueueStopCamera(
  cameraId: string,
): Promise<{ jobId: string }> {
  const job = await cameraQueue.add('stop-camera', {
    action: 'stop',
    cameraId,
  });

  if (!job.id) {
    throw new Error('Failed to create job: job ID is missing');
  }

  return { jobId: job.id };
}


