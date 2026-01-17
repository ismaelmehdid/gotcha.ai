# Notification Queue Setup

## Overview

The notification system uses BullMQ for reliable message queuing with rate limiting and retry logic.

## Prerequisites

1. Redis server running (required for BullMQ)
2. Environment variables configured

## Environment Variables

Add to `.env.local`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Running the Worker

Start the notification worker in a separate process:

```bash
pnpm worker
```

Or in production:

```bash
pnpm tsx infrastructure/queues/worker.ts
```

## Architecture

1. **Webhook receives alert** → `app/api/webhooks/detection/route.ts`
2. **Alert enqueued** → `infrastructure/queues/notification-queue.ts`
3. **Worker processes** → `infrastructure/queues/worker.ts`
4. **Notification sent** → `infrastructure/external-apis/telegram/telegram-notification-service.ts`

## Features

- **Rate Limiting**: 30 requests/second (Telegram API limit)
- **Retry Logic**: 3 attempts with exponential backoff
- **Priority Queue**: Critical alerts processed first
- **Job Persistence**: Completed jobs kept for 1 hour, failed for 24 hours

## Monitoring

The worker logs:
- Job completion
- Job failures
- Worker errors

Use BullMQ dashboard or Redis CLI to monitor queue status.

