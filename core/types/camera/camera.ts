export enum CameraStatus {
  Inactive = 'inactive',
  Starting = 'starting',
  Active = 'active',
  Stopping = 'stopping',
  Error = 'error',
}

export interface Camera {
  id: string;
  name: string;
  location?: string;
  rtspUrl: string;
  status: CameraStatus;
  createdAt: Date;
  updatedAt: Date;
}
