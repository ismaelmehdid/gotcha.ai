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

    console.log(`[TELEGRAM-API] Calling Telegram API: ${url}`);
    console.log(`[TELEGRAM-API] Payload:`, JSON.stringify({
      chat_id: payload.chatId,
      text: payload.text.substring(0, 100) + '...',
      parse_mode: payload.parseMode ?? 'HTML',
    }, null, 2));

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

        console.log(`[TELEGRAM-API] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[TELEGRAM-API] API error response:`, JSON.stringify(errorData, null, 2));
          throw new Error(
            `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`,
          );
        }

        const responseData = await response.json().catch(() => ({}));
        console.log(`[TELEGRAM-API] Success response:`, JSON.stringify(responseData, null, 2));
      });
    });

    return ok(undefined);
  } catch (error) {
    const normalizedError = unknownToError(
      error,
      'Failed to send Telegram message',
    );
    console.error('[TELEGRAM-API] Telegram message send failed:', normalizedError.message);
    if (normalizedError.stack) {
      console.error('[TELEGRAM-API] Error stack:', normalizedError.stack);
    }
    return err(normalizedError);
  }
}

async function sendTelegramPhoto(
  payload: TelegramPhotoPayload,
): Promise<Result<void, Error>> {
  try {
    const botToken = getBotToken();
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

    console.log(`[TELEGRAM-API] Calling Telegram API for photo: ${url}`);
    console.log(`[TELEGRAM-API] Photo payload:`, JSON.stringify({
      chat_id: payload.chatId,
      photo: payload.photoUrl,
      caption: payload.caption?.substring(0, 100) + '...',
      parse_mode: payload.parseMode ?? 'HTML',
    }, null, 2));

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

        console.log(`[TELEGRAM-API] Photo response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[TELEGRAM-API] Photo API error response:`, JSON.stringify(errorData, null, 2));
          throw new Error(
            `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`,
          );
        }

        const responseData = await response.json().catch(() => ({}));
        console.log(`[TELEGRAM-API] Photo success response:`, JSON.stringify(responseData, null, 2));
      });
    });

    return ok(undefined);
  } catch (error) {
    const normalizedError = unknownToError(
      error,
      'Failed to send Telegram photo',
    );
    console.error('[TELEGRAM-API] Telegram photo send failed:', normalizedError.message);
    if (normalizedError.stack) {
      console.error('[TELEGRAM-API] Error stack:', normalizedError.stack);
    }
    return err(normalizedError);
  }
}

export class TelegramNotificationService implements NotificationService {
  private readonly chatId: string;

  constructor() {
    this.chatId = getChatId();
  }

  async send(message: NotificationMessage): Promise<Result<void, Error>> {
    console.log(`[TELEGRAM] Sending notification to chat ${this.chatId}`);
    console.log(`[TELEGRAM] Message text:`, message.text);
    console.log(`[TELEGRAM] Has image: ${!!message.imageUrl}`);
    if (message.imageUrl) {
      console.log(`[TELEGRAM] Image URL: ${message.imageUrl}`);
    }
    if (message.caption) {
      console.log(`[TELEGRAM] Caption: ${message.caption}`);
    }
    
    console.log(`[TELEGRAM] Sending text message...`);
    const messageResult = await sendTelegramMessage({
      chatId: this.chatId,
      text: message.text,
      parseMode: 'HTML',
    });

    if (messageResult.isErr()) {
      console.error(`[TELEGRAM] Failed to send text message:`, messageResult.error.message);
      return messageResult;
    }

    console.log(`[TELEGRAM] Text message sent successfully`);

    if (message.imageUrl) {
      console.log(`[TELEGRAM] Sending photo...`);
      const photoResult = await sendTelegramPhoto({
        chatId: this.chatId,
        photoUrl: message.imageUrl,
        caption: message.caption,
        parseMode: 'HTML',
      });

      if (photoResult.isErr()) {
        console.warn(
          '[TELEGRAM] Photo attachment failed, but message was sent:',
          photoResult.error.message,
        );
      } else {
        console.log(`[TELEGRAM] Photo sent successfully`);
      }
    }

    console.log(`[TELEGRAM] Notification sent completely`);
    return ok(undefined);
  }
}
