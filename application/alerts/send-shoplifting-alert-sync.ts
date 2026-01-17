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
    const alert = dtoToAlert(alertDTO);
    const notificationMessage = alertToNotificationMessage(alert);

    const result = await notificationService.send(notificationMessage);

    if (result.isErr()) {
      return {
        result: 'failure',
        reason: `Failed to send alert: ${result.error.message}`,
      };
    }

    return { result: 'success', payload: undefined };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while sending alert';
    return { result: 'failure', reason: errorMessage };
  }
}

