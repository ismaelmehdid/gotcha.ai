'use server';

import type { CreateCameraDTO, CameraDTO } from '@/application/dto-types/camera-dto';
import type { ResponseWrapper } from '@/types/response-wrapper';
import { saveCamera } from '@/infrastructure/data-access/camera/camera-storage';
import { CameraStatus } from '@/core/types/camera/camera';
import { validateRtspUrl } from '@/core/types/camera/rtsp-validation';

export async function createCamera(
  dto: CreateCameraDTO,
): Promise<ResponseWrapper<CameraDTO>> {
  try {
    if (!dto.name.trim()) {
      return { result: 'failure', reason: 'Camera name is required' };
    }

    if (!dto.rtspUrl.trim()) {
      return { result: 'failure', reason: 'RTSP URL is required' };
    }

    const rtspValidation = validateRtspUrl(dto.rtspUrl);
    if (!rtspValidation.valid) {
      return { result: 'failure', reason: rtspValidation.error || 'Invalid RTSP URL' };
    }

    const now = new Date();
    const cameraId = `cam_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const camera = {
      id: cameraId,
      name: dto.name.trim(),
      location: dto.location?.trim(),
      rtspUrl: dto.rtspUrl.trim(),
      status: CameraStatus.Inactive,
      createdAt: now,
      updatedAt: now,
    };

    const result = await saveCamera(camera);

    if (result.isErr()) {
      return { result: 'failure', reason: result.error.message };
    }

    const dtoResult: CameraDTO = {
      id: camera.id,
      name: camera.name,
      location: camera.location,
      rtspUrl: camera.rtspUrl,
      status: camera.status,
      createdAt: camera.createdAt.toISOString(),
      updatedAt: camera.updatedAt.toISOString(),
    };

    return { result: 'success', payload: dtoResult };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while creating camera';
    return { result: 'failure', reason: errorMessage };
  }
}

