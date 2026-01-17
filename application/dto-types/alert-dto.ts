import type { AlertSeverity } from '@/shared/types/shoplifting-alert';

export interface CameraInfoDTO {
  id: string;
  name: string;
  location?: string;
}

export interface ShopliftingAlertDTO {
  id: string;
  camera: CameraInfoDTO;
  timestamp: string;
  confidence: number;
  severity: AlertSeverity;
  imageUrl?: string;
  description?: string;
}

