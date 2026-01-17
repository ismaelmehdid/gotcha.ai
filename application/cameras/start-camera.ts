'use server';

import type { ResponseWrapper } from '@/types/response-wrapper';
import { getCamera } from '@/infrastructure/data-access/camera/camera-storage';
import { enqueueStartCamera } from '@/infrastructure/queues/camera-queue';
import { updateCameraStatus } from '@/infrastructure/data-access/camera/camera-storage';
import { CameraStatus } from '@/core/types/camera/camera';

export async function startCamera(
  cameraId: string,
): Promise<ResponseWrapper<{ jobId: string }>> {
  try {
    const cameraResult = await getCamera(cameraId);

    if (cameraResult.isErr()) {
      return { result: 'failure', reason: cameraResult.error.message };
    }

    const camera = cameraResult.value;

    if (camera.status === CameraStatus.Active || camera.status === CameraStatus.Starting) {
      return {
        result: 'failure',
        reason: `Camera is already ${camera.status}`,
      };
    }

    await updateCameraStatus(cameraId, CameraStatus.Starting);

    const { jobId } = await enqueueStartCamera(cameraId);

    return { result: 'success', payload: { jobId } };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while starting camera';
    return { result: 'failure', reason: errorMessage };
  }
}


