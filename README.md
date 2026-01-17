# gotcha.ai

24/7 Shoplifting Detection Agent - AI-powered surveillance system with real-time Telegram notifications.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### 1. Node.js (v20 or higher)

**macOS (using Homebrew):**
```bash
brew install node@20
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify installation:**
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

### 2. pnpm (Package Manager)

**Install pnpm globally:**
```bash
npm install -g pnpm
```

**Verify installation:**
```bash
pnpm --version  # Should show 9.x.x or higher
```

### 3. Redis (Required for notification queue)

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Verify Redis is running:**
```bash
redis-cli ping  # Should return "PONG"
```

### 4. Telegram Bot (For notifications)

You'll need to create a Telegram bot and get:
- Bot Token
- Chat ID (your Telegram user ID)

See [Telegram Bot Setup](#telegram-bot-setup) section below.

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd camera-project
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This will install all project dependencies including:
- Next.js 16
- React 19
- BullMQ (for job queue)
- ioredis (Redis client)
- Three.js (for 3D backgrounds)
- And other dependencies

### Step 3: Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.template .env.
```

See [Configuration](#configuration) section for required variables.

## Configuration

### Environment Variables

Create `.env` in the root directory with the following variables:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Webhook Security
WEBHOOK_SECRET=(openssl rand -hex 32)
```

### Telegram Bot Setup

#### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions to name your bot
4. Copy the **Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### 2. Get Your Chat ID

**Method 1: Using @userinfobot**
1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start a conversation
3. The bot will send you your Chat ID (a number like `375198870`)

**Method 2: Using your bot**
1. Start a conversation with your bot
2. Send any message to your bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find `"chat":{"id":375198870}` in the response

#### 3. Update `.env`

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=375198870
```

### Webhook Secret

Generate a random secret for webhook authentication (check currently disabled):

```bash
# Using openssl
openssl rand -hex 32
```

Add to `.env`:
```env
WEBHOOK_SECRET=your_generated_secret_here
```

## Running the Application

### Development Mode

The application consists of two processes that must run simultaneously:

#### Terminal 1: Next.js Development Server

```bash
pnpm dev
```

The application will be available at: `http://localhost:3000`

#### Terminal 2: Notification Worker

```bash
pnpm worker
```

The worker processes notification jobs from the queue and sends Telegram messages.

**Important:** Both processes must be running for the notification system to work.

## Testing

### 1. Test Webhook Endpoint (GET)

Check if the webhook is accessible:

```bash
curl http://localhost:3000/api/webhooks/detection
```

Expected response:
```json
{
  "status": "ok",
  "endpoint": "Detection Webhook",
  "method": "POST",
  "expectedHeaders": {...},
  "expectedBody": {...}
}
```

### 2. Send a Test Alert (POST)

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/webhooks/detection \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_webhook_secret_from_env" \
  -d '{
    "camera_id": "cam_001",
    "camera_name": "Test Camera",
    "camera_location": "Test Location",
    "timestamp": "2026-01-17T12:00:00.000Z",
    "confidence": 85,
    "description": "Test alert"
  }'
```

**Using JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/webhooks/detection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.WEBHOOK_SECRET,
  },
  body: JSON.stringify({
    camera_id: 'cam_001',
    camera_name: 'Test Camera',
    timestamp: new Date().toISOString(),
    confidence: 85,
  }),
});

const data = await response.json();
console.log(data);
```

**Using Python:**
```python
import requests
import json
from datetime import datetime

url = "http://localhost:3000/api/webhooks/detection"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "your_webhook_secret"
}

payload = {
    "camera_id": "cam_001",
    "camera_name": "Test Camera",
    "timestamp": datetime.now().isoformat() + "Z",
    "confidence": 85
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

### 3. Verify Telegram Notification

After sending a test alert:
1. Check the worker terminal for logs: `Job <id> completed successfully`
2. Check your Telegram for the notification message

### 4. Test with Image

```bash
curl -X POST http://localhost:3000/api/webhooks/detection \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_webhook_secret" \
  -d '{
    "camera_id": "cam_002",
    "camera_name": "Test Camera",
    "timestamp": "2026-01-17T12:00:00.000Z",
    "confidence": 92,
    "image_url": "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=800"
  }'
```

## Project Structure

```
camera-project/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── webhooks/
│   │       └── detection/       # Detection webhook endpoint
│   ├── dashboard/                # Dashboard pages
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── application/                  # Application layer (use cases)
│   ├── alerts/                   # Alert use cases
│   └── dto-types/                # Data Transfer Objects
├── components/                   # React components
│   ├── ui/                       # UI primitives (shadcn)
│   ├── hero-section.tsx          # Landing page hero
│   ├── navbar.tsx                # Navigation bar
│   └── app-sidebar.tsx           # Dashboard sidebar
├── core/                         # Domain layer (business logic)
│   └── notifications/            # Notification interfaces
├── infrastructure/               # Infrastructure layer
│   ├── external-apis/            # External API integrations
│   │   └── telegram/             # Telegram notification service
│   └── queues/                   # BullMQ queue configuration
│       ├── notification-queue.ts # Queue setup
│       └── worker.ts             # Worker process
├── lib/                          # Shared utilities
├── types/                        # Shared TypeScript types
└── public/                       # Static assets
    └── logo.png                  # Project logo
```

## Architecture

The project follows a **layered architecture**:

- **app/** → Presentation layer (React components, pages)
- **application/** → Use cases (orchestration, DTOs)
- **core/** → Domain logic (types, business rules)
- **infrastructure/** → Data access (DB, external APIs)

See `.cursor/rules/01-architecture.mdc` for detailed architecture guidelines.

## Troubleshooting

### Redis Connection Errors

**Error:** `ECONNREFUSED 127.0.0.1:6379`

**Solutions:**
1. Verify Redis is running:
   ```bash
   redis-cli ping  # Should return "PONG"
   ```

2. Check Redis configuration in `.env`:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. If using Docker:
   ```bash
   docker ps  # Check if Redis container is running
   docker start redis  # Start if stopped
   ```

### Worker Not Starting

**Error:** `TELEGRAM_CHAT_ID environment variable is not set`

**Solution:**
1. Ensure `.env` exists in the root directory
2. Verify all required variables are set:
   ```bash
   cat .env
   ```
3. Restart the worker after updating `.env`

### Telegram Notifications Not Sending

**Checklist:**
1. ✅ Worker is running (`pnpm worker`)
2. ✅ `TELEGRAM_BOT_TOKEN` is correct
3. ✅ `TELEGRAM_CHAT_ID` is correct
4. ✅ You've sent a message to your bot (to initialize chat)
5. ✅ Check worker logs for errors

**Test bot token:**
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
```

### Webhook Returns 401 Unauthorized

**Error:** `Invalid or missing API key`

**Solution:**
1. Ensure `WEBHOOK_SECRET` is set in `.env`
2. Use the same secret in the `x-api-key` header:
   ```bash
   curl -H "x-api-key: your_webhook_secret" ...
   ```

### Webhook Returns 400 Bad Request

**Error:** `Invalid payload structure`

**Solution:**
1. Check the required fields:
   - `camera_id` (string, required)
   - `camera_name` (string, required)
   - `timestamp` (ISO 8601 string, required)
   - `confidence` (number 0-100, required)
2. Verify JSON format is correct
3. Check the GET endpoint for expected format:
   ```bash
   curl http://localhost:3000/api/webhooks/detection
   ```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
1. Find the process using port 3000:
   ```bash
   # macOS/Linux
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

2. Or use a different port:
   ```bash
   PORT=3001 pnpm dev
   ```

## Scripts

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm worker` - Start notification worker
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Biome
- `pnpm check` - Check code with Biome