import type { CameraStatus } from '@/core/types/camera/camera';

export interface CameraDTO {
  id: string;
  name: string;
  location?: string;
  rtspUrl: string;
  status: CameraStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCameraDTO {
  name: string;
  location?: string;
  rtspUrl: string;
}
