export enum AlertSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface CameraInfo {
  id: string;
  name: string;
  location?: string;
}

export interface ShopliftingAlert {
  id: string;
  camera: CameraInfo;
  timestamp: Date;
  confidence: number;
  severity: AlertSeverity;
  imageUrl?: string;
  description?: string;
}

export function getSeverityFromConfidence(confidence: number): AlertSeverity {
  if (confidence >= 0.9) return AlertSeverity.Critical;
  if (confidence >= 0.75) return AlertSeverity.High;
  if (confidence >= 0.5) return AlertSeverity.Medium;
  return AlertSeverity.Low;
}
