import 'dotenv/config';
import { TelegramNotificationService } from '@/infrastructure/external-apis/telegram/telegram-notification-service';
import { createNotificationWorker } from './notification-queue';

const notificationService = new TelegramNotificationService();
const worker = createNotificationWorker(notificationService);

worker.on('completed', (job) => {
  console.log(`[NOTIFICATION-WORKER] Job ${job.id} completed successfully`);
  console.log(`[NOTIFICATION-WORKER] Job data:`, JSON.stringify(job.data, null, 2));
});

worker.on('failed', (job, err) => {
  console.error(`[NOTIFICATION-WORKER] Job ${job?.id} failed:`, err.message);
  if (job?.data) {
    console.error(`[NOTIFICATION-WORKER] Failed job data:`, JSON.stringify(job.data, null, 2));
  }
  console.error(`[NOTIFICATION-WORKER] Error stack:`, err.stack);
});

worker.on('error', (err) => {
  console.error('[NOTIFICATION-WORKER] Worker error:', err);
});

worker.on('active', (job) => {
  console.log(`[NOTIFICATION-WORKER] Job ${job.id} is now active`);
  console.log(`[NOTIFICATION-WORKER] Processing alert:`, JSON.stringify(job.data, null, 2));
});

console.log('[NOTIFICATION-WORKER] Notification worker started');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
