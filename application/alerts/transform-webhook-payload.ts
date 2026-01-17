import type { ShopliftingAlertDTO } from '@/application/dto-types/alert-dto';
import { getSeverityFromConfidence } from '@/shared/types/shoplifting-alert';

export interface WebhookPayload {
  camera_id: string;
  camera_name: string;
  camera_location?: string;
  timestamp: string;
  confidence: number;
  image_url?: string;
  description?: string;
}

export function transformWebhookPayloadToAlertDTO(
  payload: WebhookPayload,
): ShopliftingAlertDTO {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const confidenceNormalized = payload.confidence / 100;

  return {
    id: alertId,
    camera: {
      id: payload.camera_id,
      name: payload.camera_name,
      location: payload.camera_location,
    },
    timestamp: payload.timestamp,
    confidence: confidenceNormalized,
    severity: getSeverityFromConfidence(confidenceNormalized),
    imageUrl: payload.image_url,
    description: payload.description,
  };
}
