'use server';

import type { ResponseWrapper } from '@/types/response-wrapper';
import { getCamera } from '@/infrastructure/data-access/camera/camera-storage';
import { enqueueStopCamera } from '@/infrastructure/queues/camera-queue';
import { updateCameraStatus } from '@/infrastructure/data-access/camera/camera-storage';
import { CameraStatus } from '@/core/types/camera/camera';

export async function stopCamera(cameraId: string): Promise<ResponseWrapper<void>> {
  try {
    const cameraResult = await getCamera(cameraId);

    if (cameraResult.isErr()) {
      return { result: 'failure', reason: cameraResult.error.message };
    }

    const camera = cameraResult.value;

    if (camera.status === CameraStatus.Inactive || camera.status === CameraStatus.Stopping) {
      return {
        result: 'failure',
        reason: `Camera is already ${camera.status}`,
      };
    }

    await updateCameraStatus(cameraId, CameraStatus.Stopping);
    await enqueueStopCamera(cameraId);

    return { result: 'success', payload: undefined };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while stopping camera';
    return { result: 'failure', reason: errorMessage };
  }
}


