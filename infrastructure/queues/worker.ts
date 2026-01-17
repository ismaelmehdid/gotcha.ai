import 'dotenv/config';
import { TelegramNotificationService } from '@/infrastructure/external-apis/telegram/telegram-notification-service';
import { createNotificationWorker } from './notification-queue';

const notificationService = new TelegramNotificationService();
const worker = createNotificationWorker(notificationService);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Notification worker started');

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
