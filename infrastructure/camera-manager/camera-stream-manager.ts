import { err, ok, Result } from 'neverthrow';
import type { Camera } from '@/core/types/camera/camera';
import { unknownToError } from '@/lib/errors';
import { sendDetectionAlert } from './alert-sender';
import { type CameraCommand, redisPubSub } from './redis-pubsub';

export interface StreamConnection {
  cameraId: string;
  startedAt: Date;
  lastPredictionAt?: Date;
}

class CameraStreamManager {
  private activeStreams = new Map<string, StreamConnection>();

  async startStream(camera: Camera): Promise<Result<void, Error>> {
    try {
      if (this.activeStreams.has(camera.id)) {
        return err(
          new Error(`Stream for camera ${camera.id} is already active`),
        );
      }

      const modelId = process.env.ROBOFLOW_MODEL_ID;

      if (!modelId) {
        return err(
          new Error('ROBOFLOW_MODEL_ID environment variable is not set'),
        );
      }

      const command: CameraCommand = {
        action: 'start',
        cameraId: camera.id,
        rtspUrl: camera.rtspUrl,
        cameraName: camera.name,
        cameraLocation: camera.location,
        modelId,
      };

      const publishResult = await redisPubSub.publishCommand(command);
      if (publishResult.isErr()) {
        return err(publishResult.error);
      }

      const statusSubscribeResult = await redisPubSub.subscribeToStatus(
        camera.id,
        async (statusMessage) => {
          console.log(`[CAMERA-STREAM] Status update for camera ${camera.id}:`, JSON.stringify(statusMessage, null, 2));
          
          if (statusMessage.status === 'error') {
            console.error(
              `[CAMERA-STREAM] Camera ${camera.id} stream error:`,
              statusMessage.error,
            );
          } else {
            console.log(`[CAMERA-STREAM] Camera ${camera.id} status changed to: ${statusMessage.status}`);
          }
        },
      );

      if (statusSubscribeResult.isErr()) {
        return err(statusSubscribeResult.error);
      }

      const predictionSubscribeResult =
        await redisPubSub.subscribeToPredictions(camera.id, async (message) => {
          console.log(`[CAMERA-STREAM] Received prediction message for camera ${camera.id}:`, JSON.stringify(message, null, 2));
          console.log(`[CAMERA-STREAM] Processing ${message.predictions.length} predictions`);
          
          for (const pred of message.predictions) {
            console.log(`[CAMERA-STREAM] Processing prediction: class=${pred.class}, confidence=${pred.confidence}`);
            
            if (pred.class === 'shoplifting') {
              const confidence = pred.confidence;
              console.log(`[CAMERA-STREAM] Shoplifting detected! Confidence: ${confidence}, Camera: ${camera.name} (${camera.id})`);

              this.updateLastPrediction(camera.id);

              console.log(`[CAMERA-STREAM] Sending detection alert for camera ${camera.id}...`);
              await sendDetectionAlert(camera, confidence);
            }
          }
        });

      if (predictionSubscribeResult.isErr()) {
        await redisPubSub.unsubscribe(camera.id);
        return err(predictionSubscribeResult.error);
      }

      this.activeStreams.set(camera.id, {
        cameraId: camera.id,
        startedAt: new Date(),
      });

      return ok(undefined);
    } catch (error) {
      return err(unknownToError(error, 'Failed to start camera stream'));
    }
  }

  async stopStream(cameraId: string): Promise<Result<void, Error>> {
    try {
      const stream = this.activeStreams.get(cameraId);

      if (!stream) {
        return err(new Error(`No active stream found for camera ${cameraId}`));
      }

      const command: CameraCommand = {
        action: 'stop',
        cameraId,
      };

      const publishResult = await redisPubSub.publishCommand(command);
      if (publishResult.isErr()) {
        return err(publishResult.error);
      }

      const unsubscribeResult = await redisPubSub.unsubscribe(cameraId);
      if (unsubscribeResult.isErr()) {
        console.warn(
          `Failed to unsubscribe from channels for ${cameraId}:`,
          unsubscribeResult.error.message,
        );
      }

      this.activeStreams.delete(cameraId);

      return ok(undefined);
    } catch (error) {
      const stream = this.activeStreams.get(cameraId);
      if (stream) {
        this.activeStreams.delete(cameraId);
      }
      return err(unknownToError(error, 'Failed to stop camera stream'));
    }
  }

  getActiveStreams(): Map<string, StreamConnection> {
    return new Map(this.activeStreams);
  }

  hasActiveStream(cameraId: string): boolean {
    return this.activeStreams.has(cameraId);
  }

  private updateLastPrediction(cameraId: string): void {
    const stream = this.activeStreams.get(cameraId);
    if (stream) {
      stream.lastPredictionAt = new Date();
    }
  }

  async stopAllStreams(): Promise<void> {
    const cameraIds = Array.from(this.activeStreams.keys());
    for (const cameraId of cameraIds) {
      await this.stopStream(cameraId);
    }
  }
}

export const cameraStreamManager = new CameraStreamManager();
