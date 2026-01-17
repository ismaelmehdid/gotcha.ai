import type { ShopliftingAlertDTO } from '@/application/dto-types/alert-dto';
import type { ShopliftingAlert } from '@/shared/types/shoplifting-alert';
import type { NotificationService } from '@/core/notifications/notification-service';
import { alertToNotificationMessage } from '@/application/alerts/format-alert-message';
import type { ResponseWrapper } from '@/types/response-wrapper';

function dtoToAlert(dto: ShopliftingAlertDTO): ShopliftingAlert {
  return {
    id: dto.id,
    camera: dto.camera,
    timestamp: new Date(dto.timestamp),
    confidence: dto.confidence,
    severity: dto.severity,
    imageUrl: dto.imageUrl,
    description: dto.description,
  };
}

export async function sendShopliftingAlertSync(
  alertDTO: ShopliftingAlertDTO,
  notificationService: NotificationService,
): Promise<ResponseWrapper<void>> {
  try {
    console.log(`[ALERT-SYNC] Processing alert DTO:`, JSON.stringify(alertDTO, null, 2));
    
    const alert = dtoToAlert(alertDTO);
    console.log(`[ALERT-SYNC] Converted to alert:`, {
      id: alert.id,
      camera: alert.camera.name,
      confidence: alert.confidence,
      severity: alert.severity,
      timestamp: alert.timestamp.toISOString(),
    });
    
    const notificationMessage = alertToNotificationMessage(alert);
    console.log(`[ALERT-SYNC] Notification message:`, JSON.stringify(notificationMessage, null, 2));
    console.log(`[ALERT-SYNC] Sending notification via ${notificationService.constructor.name}...`);

    const result = await notificationService.send(notificationMessage);

    if (result.isErr()) {
      console.error(`[ALERT-SYNC] Failed to send notification:`, result.error.message);
      return {
        result: 'failure',
        reason: `Failed to send alert: ${result.error.message}`,
      };
    }

    console.log(`[ALERT-SYNC] Notification sent successfully!`);
    return { result: 'success', payload: undefined };
  } catch (error) {
    console.error(`[ALERT-SYNC] Error processing alert:`, error);
    if (error instanceof Error) {
      console.error(`[ALERT-SYNC] Error stack:`, error.stack);
    }
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while sending alert';
    return { result: 'failure', reason: errorMessage };
  }
}

