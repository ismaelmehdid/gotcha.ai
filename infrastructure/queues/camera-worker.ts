import 'dotenv/config';
import { Worker } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import { cameraQueue, type CameraCommand } from './camera-queue';
import { cameraStreamManager } from '@/infrastructure/camera-manager/camera-stream-manager';
import { getCamera, getAllCameras, updateCameraStatus } from '@/infrastructure/data-access/camera/camera-storage';
import { CameraStatus } from '@/core/types/camera/camera';
import { withLock } from '@/infrastructure/data-access/camera/redis-lock';

const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

const worker = new Worker<CameraCommand>(
  'cameras',
  async (job) => {
    const { action, cameraId } = job.data;
    console.log(`[CAMERA-WORKER] Processing job ${job.id}: action=${action}, cameraId=${cameraId}`);
    console.log(`[CAMERA-WORKER] Job data:`, JSON.stringify(job.data, null, 2));

    if (action === 'start') {
      console.log(`[CAMERA-WORKER] Starting camera ${cameraId}...`);
      const result = await withLock(cameraId, async () => {
        console.log(`[CAMERA-WORKER] Lock acquired for camera ${cameraId}`);
        const cameraResult = await getCamera(cameraId);

        if (cameraResult.isErr()) {
          console.error(`[CAMERA-WORKER] Camera not found: ${cameraResult.error.message}`);
          throw new Error(`Camera not found: ${cameraResult.error.message}`);
        }

        const camera = cameraResult.value;
        console.log(`[CAMERA-WORKER] Camera found:`, JSON.stringify({
          id: camera.id,
          name: camera.name,
          location: camera.location,
          rtspUrl: camera.rtspUrl,
          status: camera.status,
        }, null, 2));

        if (cameraStreamManager.hasActiveStream(cameraId)) {
          console.log(`[CAMERA-WORKER] Camera ${cameraId} is already streaming, skipping`);
          return { success: true, cameraId, skipped: true };
        }

        console.log(`[CAMERA-WORKER] Updating camera status to Starting...`);
        await updateCameraStatus(cameraId, CameraStatus.Starting);

        console.log(`[CAMERA-WORKER] Starting stream via cameraStreamManager...`);
        const streamResult = await cameraStreamManager.startStream(camera);

        if (streamResult.isErr()) {
          console.error(`[CAMERA-WORKER] Failed to start stream:`, streamResult.error.message);
          await updateCameraStatus(cameraId, CameraStatus.Error);
          throw new Error(`Failed to start stream: ${streamResult.error.message}`);
        }

        console.log(`[CAMERA-WORKER] Stream started successfully, updating status to Active...`);
        await updateCameraStatus(cameraId, CameraStatus.Active);
        console.log(`[CAMERA-WORKER] Camera ${cameraId} stream started successfully`);

        return { success: true, cameraId };
      });

      if (result.isErr()) {
        console.error(`[CAMERA-WORKER] Error in start action:`, result.error.message);
        throw new Error(result.error.message);
      }

      console.log(`[CAMERA-WORKER] Start action completed:`, JSON.stringify(result.value, null, 2));
      return result.value;
    } else if (action === 'stop') {
      console.log(`[CAMERA-WORKER] Stopping camera ${cameraId}...`);
      const result = await withLock(cameraId, async () => {
        console.log(`[CAMERA-WORKER] Lock acquired for stopping camera ${cameraId}`);
        const streamResult = await cameraStreamManager.stopStream(cameraId);

        if (streamResult.isErr()) {
          console.error(`[CAMERA-WORKER] Failed to stop stream:`, streamResult.error.message);
          await updateCameraStatus(cameraId, CameraStatus.Error);
          throw new Error(`Failed to stop stream: ${streamResult.error.message}`);
        }

        console.log(`[CAMERA-WORKER] Stream stopped, updating status to Inactive...`);
        await updateCameraStatus(cameraId, CameraStatus.Inactive);
        console.log(`[CAMERA-WORKER] Camera ${cameraId} stream stopped`);

        return { success: true, cameraId };
      });

      if (result.isErr()) {
        console.error(`[CAMERA-WORKER] Error in stop action:`, result.error.message);
        throw new Error(result.error.message);
      }

      console.log(`[CAMERA-WORKER] Stop action completed:`, JSON.stringify(result.value, null, 2));
      return result.value;
    } else {
      console.error(`[CAMERA-WORKER] Unknown action: ${action}`);
      throw new Error(`Unknown action: ${action}`);
    }
  },
  {
    connection: REDIS_CONFIG,
    concurrency: 5,
  },
);

async function autoRestartActiveCameras(): Promise<void> {
  try {
    const camerasResult = await getAllCameras();

    if (camerasResult.isErr()) {
      console.error('Failed to load cameras for auto-restart:', camerasResult.error.message);
      return;
    }

    const cameras = camerasResult.value;
    const activeCameras = cameras.filter(
      (camera) => camera.status === CameraStatus.Active,
    );

    console.log(`Found ${activeCameras.length} active cameras to restart`);

    for (const camera of activeCameras) {
      await cameraQueue.add('start-camera', {
        action: 'start',
        cameraId: camera.id,
      });
      console.log(`Queued restart for camera ${camera.id}`);
    }
  } catch (error) {
    console.error('Error during auto-restart:', error);
  }
}

worker.on('completed', (job) => {
  console.log(`[CAMERA-WORKER] Job ${job.id} completed successfully`);
  console.log(`[CAMERA-WORKER] Job result:`, JSON.stringify(job.returnvalue, null, 2));
});

worker.on('failed', (job, err) => {
  console.error(`[CAMERA-WORKER] Job ${job?.id} failed:`, err.message);
  if (job?.data) {
    console.error(`[CAMERA-WORKER] Failed job data:`, JSON.stringify(job.data, null, 2));
  }
  console.error(`[CAMERA-WORKER] Error stack:`, err.stack);
});

worker.on('error', (err) => {
  console.error('[CAMERA-WORKER] Worker error:', err);
});

worker.on('active', (job) => {
  console.log(`[CAMERA-WORKER] Job ${job.id} is now active`);
  console.log(`[CAMERA-WORKER] Processing command:`, JSON.stringify(job.data, null, 2));
});

console.log('[CAMERA-WORKER] Camera worker started');

autoRestartActiveCameras().catch((error) => {
  console.error('Error during auto-restart on startup:', error);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing camera worker...');
  await cameraStreamManager.stopAllStreams();
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing camera worker...');
  await cameraStreamManager.stopAllStreams();
  await worker.close();
  process.exit(0);
});

