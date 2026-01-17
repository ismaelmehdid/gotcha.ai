import Redis from 'ioredis';
import { err, ok, Result } from 'neverthrow';
import { unknownToError } from '@/lib/errors';

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

const CAMERA_COMMANDS_CHANNEL = 'camera:commands';
const CAMERA_PREDICTIONS_CHANNEL_PREFIX = 'camera:predictions:';
const CAMERA_STATUS_CHANNEL_PREFIX = 'camera:status:';

export interface CameraCommand {
  action: 'start' | 'stop';
  cameraId: string;
  rtspUrl?: string;
  cameraName?: string;
  cameraLocation?: string;
  modelId?: string;
}

export interface PredictionMessage {
  cameraId: string;
  timestamp: string | null;
  predictions: Array<{
    class: string;
    confidence: number;
    imageUrl?: string;
  }>;
}

export interface StatusMessage {
  cameraId: string;
  status: 'starting' | 'active' | 'stopping' | 'stopped' | 'error';
  error?: string;
}

type PredictionCallback = (message: PredictionMessage) => void;
type StatusCallback = (message: StatusMessage) => void;

class RedisPubSub {
  private publisher: Redis;
  private subscribers: Map<string, Redis> = new Map();
  private predictionCallbacks: Map<string, PredictionCallback> = new Map();
  private statusCallbacks: Map<string, StatusCallback> = new Map();

  constructor() {
    this.publisher = new Redis(REDIS_CONFIG);
  }

  async publishCommand(command: CameraCommand): Promise<Result<void, Error>> {
    try {
      const commandJson = JSON.stringify(command);
      console.log(`[REDIS] Publishing command to channel ${CAMERA_COMMANDS_CHANNEL}:`, commandJson);
      await this.publisher.publish(
        CAMERA_COMMANDS_CHANNEL,
        commandJson,
      );
      console.log(`[REDIS] Command published successfully: ${command.action} for camera ${command.cameraId}`);
      return ok(undefined);
    } catch (error) {
      console.error(`[REDIS] Failed to publish command:`, error);
      return err(unknownToError(error, 'Failed to publish command'));
    }
  }

  async subscribeToPredictions(
    cameraId: string,
    callback: PredictionCallback,
  ): Promise<Result<void, Error>> {
    try {
      if (this.predictionCallbacks.has(cameraId)) {
        return err(new Error(`Already subscribed to predictions for ${cameraId}`));
      }

      let subscriber = this.subscribers.get(cameraId);
      if (!subscriber) {
        subscriber = new Redis(REDIS_CONFIG);
        this.subscribers.set(cameraId, subscriber);
      }

      const channel = `${CAMERA_PREDICTIONS_CHANNEL_PREFIX}${cameraId}`;
      this.predictionCallbacks.set(cameraId, callback);

      subscriber.subscribe(channel);

      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          console.log(`[REDIS] Received prediction message on channel ${ch} for camera ${cameraId}:`, message);
          try {
            const data = JSON.parse(message) as PredictionMessage;
            console.log(`[REDIS] Parsed prediction data:`, JSON.stringify(data, null, 2));
            console.log(`[REDIS] Predictions count: ${data.predictions.length}`);
            data.predictions.forEach((pred, idx) => {
              console.log(`[REDIS] Prediction ${idx + 1}: class=${pred.class}, confidence=${pred.confidence}, imageUrl=${pred.imageUrl ?? 'N/A'}`);
            });
            callback(data);
          } catch (error) {
            console.error(`[REDIS] Error parsing prediction message for ${cameraId}:`, error);
          }
        }
      });

      subscriber.on('error', (error) => {
        console.error(`Redis subscriber error for ${cameraId}:`, error);
      });

      return ok(undefined);
    } catch (error) {
      return err(unknownToError(error, 'Failed to subscribe to predictions'));
    }
  }

  async subscribeToStatus(
    cameraId: string,
    callback: StatusCallback,
  ): Promise<Result<void, Error>> {
    try {
      if (this.statusCallbacks.has(cameraId)) {
        return err(new Error(`Already subscribed to status for ${cameraId}`));
      }

      let subscriber = this.subscribers.get(cameraId);
      if (!subscriber) {
        subscriber = new Redis(REDIS_CONFIG);
        this.subscribers.set(cameraId, subscriber);
      }

      const channel = `${CAMERA_STATUS_CHANNEL_PREFIX}${cameraId}`;
      this.statusCallbacks.set(cameraId, callback);

      subscriber.subscribe(channel);

      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          console.log(`[REDIS] Received status message on channel ${ch} for camera ${cameraId}:`, message);
          try {
            const data = JSON.parse(message) as StatusMessage;
            console.log(`[REDIS] Parsed status data:`, JSON.stringify(data, null, 2));
            console.log(`[REDIS] Camera ${cameraId} status: ${data.status}${data.error ? `, error: ${data.error}` : ''}`);
            callback(data);
          } catch (error) {
            console.error(`[REDIS] Error parsing status message for ${cameraId}:`, error);
          }
        }
      });

      subscriber.on('error', (error) => {
        console.error(`Redis subscriber error for ${cameraId}:`, error);
      });

      return ok(undefined);
    } catch (error) {
      return err(unknownToError(error, 'Failed to subscribe to status'));
    }
  }

  async unsubscribe(cameraId: string): Promise<Result<void, Error>> {
    try {
      const subscriber = this.subscribers.get(cameraId);
      if (subscriber) {
        const predictionChannel = `${CAMERA_PREDICTIONS_CHANNEL_PREFIX}${cameraId}`;
        const statusChannel = `${CAMERA_STATUS_CHANNEL_PREFIX}${cameraId}`;

        await subscriber.unsubscribe(predictionChannel, statusChannel);
        await subscriber.quit();

        this.subscribers.delete(cameraId);
        this.predictionCallbacks.delete(cameraId);
        this.statusCallbacks.delete(cameraId);
      }

      return ok(undefined);
    } catch (error) {
      return err(unknownToError(error, 'Failed to unsubscribe'));
    }
  }

  async close(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscribers.keys()).map((cameraId) =>
      this.unsubscribe(cameraId),
    );

    await Promise.all(unsubscribePromises);
    await this.publisher.quit();
  }
}

export const redisPubSub = new RedisPubSub();

