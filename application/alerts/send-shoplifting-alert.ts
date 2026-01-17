'use server';

import type { ShopliftingAlertDTO } from '@/application/dto-types/alert-dto';
import { enqueueNotification } from '@/infrastructure/queues/notification-queue';
import type { ResponseWrapper } from '@/types/response-wrapper';

export async function sendShopliftingAlert(
  alertDTO: ShopliftingAlertDTO,
): Promise<ResponseWrapper<{ jobId: string }>> {
  try {
    const { jobId } = await enqueueNotification(alertDTO);
    return { result: 'success', payload: { jobId } };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred while enqueueing alert';
    return { result: 'failure', reason: errorMessage };
  }
}
