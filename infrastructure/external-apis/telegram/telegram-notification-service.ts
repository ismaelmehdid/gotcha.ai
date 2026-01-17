import { err, ok, type Result } from 'neverthrow';
import pLimit from 'p-limit';
import type {
  NotificationMessage,
  NotificationService,
} from '@/core/notifications/notification-service';
import { unknownToError } from '@/lib/errors';

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const TELEGRAM_RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 1000;

const rateLimiter = pLimit(1);

let lastRequestTime = 0;

async function rateLimitedRequest<T>(operation: () => Promise<T>): Promise<T> {
  return rateLimiter(async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = RATE_LIMIT_WINDOW_MS / TELEGRAM_RATE_LIMIT;

    if (timeSinceLastRequest < minDelay) {
      await sleep(minDelay - timeSinceLastRequest);
    }

    lastRequestTime = Date.now();
    return operation();
  });
}

interface TelegramMessagePayload {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

interface TelegramPhotoPayload {
  chatId: string;
  photoUrl: string;
  caption?: string;
  parseMode?: 'HTML' | 'Markdown';
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY_MS,
): Promise<T> {
  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = unknownToError(error, 'Unknown error during retry');

      if (attempt < maxRetries - 1) {
        console.warn(
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          lastError.message,
        );
        await sleep(delay);
        delay *= 2;
      }
    }
  }

  throw lastError ?? new Error('All retry attempts failed');
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
  }
  return token;
}

function getChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    throw new Error('TELEGRAM_CHAT_ID environment variable is not set');
  }
  return chatId;
}

async function sendTelegramMessage(
  payload: TelegramMessagePayload,
): Promise<Result<void, Error>> {
  try {
    const botToken = getBotToken();
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await rateLimitedRequest(async () => {
      await executeWithRetry(async () => {
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: payload.chatId,
              text: payload.text,
              parse_mode: payload.parseMode ?? 'HTML',
            }),
          },
          TIMEOUT_MS,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`,
          );
        }
      });
    });

    return ok(undefined);
  } catch (error) {
    const normalizedError = unknownToError(
      error,
      'Failed to send Telegram message',
    );
    console.error('Telegram message send failed:', normalizedError.message);
    return err(normalizedError);
  }
}

async function sendTelegramPhoto(
  payload: TelegramPhotoPayload,
): Promise<Result<void, Error>> {
  try {
    const botToken = getBotToken();
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    await rateLimitedRequest(async () => {
      await executeWithRetry(async () => {
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: payload.chatId,
              photo: payload.photoUrl,
              caption: payload.caption,
              parse_mode: payload.parseMode ?? 'HTML',
            }),
          },
          TIMEOUT_MS,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`,
          );
        }
      });
    });

    return ok(undefined);
  } catch (error) {
    const normalizedError = unknownToError(
      error,
      'Failed to send Telegram photo',
    );
    console.error('Telegram photo send failed:', normalizedError.message);
    return err(normalizedError);
  }
}

export class TelegramNotificationService implements NotificationService {
  private readonly chatId: string;

  constructor() {
    this.chatId = getChatId();
  }

  async send(message: NotificationMessage): Promise<Result<void, Error>> {
    const messageResult = await sendTelegramMessage({
      chatId: this.chatId,
      text: message.text,
      parseMode: 'HTML',
    });

    if (messageResult.isErr()) {
      return messageResult;
    }

    if (message.imageUrl) {
      const photoResult = await sendTelegramPhoto({
        chatId: this.chatId,
        photoUrl: message.imageUrl,
        caption: message.caption,
        parseMode: 'HTML',
      });

      if (photoResult.isErr()) {
        console.warn(
          'Photo attachment failed, but message was sent:',
          photoResult.error.message,
        );
      }
    }

    return ok(undefined);
  }
}
