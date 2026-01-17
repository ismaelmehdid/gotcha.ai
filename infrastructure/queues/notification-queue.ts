import { Queue, QueueEvents, Worker } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import { sendShopliftingAlertSync } from '@/application/alerts/send-shoplifting-alert-sync';
import type { ShopliftingAlertDTO } from '@/application/dto-types/alert-dto';
import type { NotificationService } from '@/core/notifications/notification-service';

const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const notificationQueue = new Queue<ShopliftingAlertDTO>(
  'notifications',
  {
    connection: REDIS_CONFIG,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 86400,
      },
    },
  },
);

export const notificationQueueEvents = new QueueEvents('notifications', {
  connection: REDIS_CONFIG,
});

export function createNotificationWorker(
  notificationService: NotificationService,
): Worker<ShopliftingAlertDTO> {
  return new Worker<ShopliftingAlertDTO>(
    'notifications',
    async (job) => {
      const { data } = job;
      const result = await sendShopliftingAlertSync(data, notificationService);

      if (result.result === 'failure') {
        throw new Error(result.reason);
      }

      return result;
    },
    {
      connection: REDIS_CONFIG,
      concurrency: 5,
      limiter: {
        max: 30,
        duration: 1000,
      },
    },
  );
}

export async function enqueueNotification(
  alertDTO: ShopliftingAlertDTO,
): Promise<{ jobId: string }> {
  const job = await notificationQueue.add('send-notification', alertDTO, {
    priority: alertDTO.severity === 'critical' ? 1 : 5,
  });

  if (!job.id) {
    throw new Error('Failed to create job: job ID is missing');
  }

  return { jobId: job.id };
}
