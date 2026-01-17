'use server';

import type { CameraDTO } from '@/application/dto-types/camera-dto';
import type { ResponseWrapper } from '@/types/response-wrapper';
import { getAllCameras } from '@/infrastructure/data-access/camera/camera-storage';

export async function listCameras(): Promise<ResponseWrapper<CameraDTO[]>> {
  try {
    const result = await getAllCameras();

    if (result.isErr()) {
      return { result: 'failure', reason: result.error.message };
    }

    const dtos: CameraDTO[] = result.value.map((camera) => ({
      id: camera.id,
      name: camera.name,
      location: camera.location,
      rtspUrl: camera.rtspUrl,
      status: camera.status,
      createdAt: camera.createdAt.toISOString(),
      updatedAt: camera.updatedAt.toISOString(),
    }));

    return { result: 'success', payload: dtos };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while listing cameras';
    return { result: 'failure', reason: errorMessage };
  }
}


