import { sendShopliftingAlert } from '@/application/alerts/send-shoplifting-alert';
import { transformWebhookPayloadToAlertDTO } from '@/application/alerts/transform-webhook-payload';
import type { Camera } from '@/core/types/camera/camera';

export async function sendDetectionAlert(
  camera: Camera,
  confidence: number,
): Promise<void> {
  try {
    console.log(
      `[ALERT] Preparing alert for camera ${camera.id} (${camera.name})`,
    );
    console.log(
      `[ALERT] Confidence: ${confidence} (${Math.round(confidence * 100)}%)`,
    );

    const alertDTO = transformWebhookPayloadToAlertDTO({
      camera_id: camera.id,
      camera_name: camera.name,
      camera_location: camera.location,
      timestamp: new Date().toISOString(),
      confidence: Math.round(confidence * 100),
      description: `Shoplifting detected with ${Math.round(confidence * 100)}% confidence`,
    });

    console.log(
      `[ALERT] Alert DTO created:`,
      JSON.stringify(alertDTO, null, 2),
    );
    console.log(`[ALERT] Enqueueing alert to notification queue...`);

    const result = await sendShopliftingAlert(alertDTO);

    if (result.result === 'failure') {
      console.error(`[ALERT] Failed to send alert:`, result.reason);
    } else {
      console.log(
        `[ALERT] Alert enqueued successfully! Job ID: ${result.payload.jobId}`,
      );
      console.log(`[ALERT] Alert details:`, {
        camera: camera.name,
        location: camera.location,
        confidence: Math.round(confidence * 100) + '%',
        severity: alertDTO.severity,
      });
    }
  } catch (error) {
    console.error(`[ALERT] Error sending alert:`, error);
    if (error instanceof Error) {
      console.error(`[ALERT] Error stack:`, error.stack);
    }
  }
}
