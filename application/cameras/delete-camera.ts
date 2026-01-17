'use server';

import type { ResponseWrapper } from '@/types/response-wrapper';
import { getCamera, deleteCamera } from '@/infrastructure/data-access/camera/camera-storage';
import { enqueueStopCamera } from '@/infrastructure/queues/camera-queue';
import { CameraStatus } from '@/core/types/camera/camera';

export async function deleteCameraUseCase(
  cameraId: string,
): Promise<ResponseWrapper<void>> {
  try {
    const cameraResult = await getCamera(cameraId);

    if (cameraResult.isErr()) {
      return { result: 'failure', reason: cameraResult.error.message };
    }

    const camera = cameraResult.value;

    if (camera.status === CameraStatus.Active || camera.status === CameraStatus.Starting) {
      await enqueueStopCamera(cameraId);
    }

    const deleteResult = await deleteCamera(cameraId);

    if (deleteResult.isErr()) {
      return { result: 'failure', reason: deleteResult.error.message };
    }

    return { result: 'success', payload: undefined };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while deleting camera';
    return { result: 'failure', reason: errorMessage };
  }
}


