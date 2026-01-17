import json
from datetime import datetime
from typing import Optional
from inference import InferencePipeline
from config import Config
from redis_client import RedisClient

class StreamHandler:
    def __init__(self, camera_id: str, rtsp_url: str, camera_name: str, 
                 camera_location: Optional[str], model_id: str, redis_client: RedisClient):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.camera_name = camera_name
        self.camera_location = camera_location
        self.model_id = model_id
        self.redis_client = redis_client
        self.pipeline: Optional[InferencePipeline] = None
        self.is_running = False
    
    def on_prediction(self, predictions: dict, video_frame):
        if not self.is_running:
            return
        
        try:
            model_predictions = predictions.get('predictions', [])
            
            if not model_predictions:
                return
            
            for pred in model_predictions:
                pred_class = pred.get('class', 'unknown')
                confidence = pred.get('confidence', 0.0)
                print(f"[ROBOFLOW] DEBUG: Found class '{pred_class}' with confidence {confidence:.3f}")
            
            shoplifting_predictions = []
            for pred in model_predictions:
                pred_class = pred.get('class', '').lower()
                if pred_class == 'shoplifting':
                    confidence = pred.get('confidence', 0.0)
                    print(f"[ROBOFLOW] 🚨 SHOPLIFTING DETECTED on camera {self.camera_id}: confidence={confidence:.3f}, threshold={Config.ROBOFLOW_CONFIDENCE_THRESHOLD}")
                    
                    if confidence >= Config.ROBOFLOW_CONFIDENCE_THRESHOLD:
                        shoplifting_predictions.append({
                            'class': 'shoplifting',
                            'confidence': confidence,
                            'imageUrl': pred.get('image_url')
                        })
                        print(f"[ROBOFLOW] ✅ Shoplifting above threshold ({confidence:.3f} >= {Config.ROBOFLOW_CONFIDENCE_THRESHOLD})")
                    else:
                        print(f"[ROBOFLOW] ⚠️  Shoplifting below threshold ({confidence:.3f} < {Config.ROBOFLOW_CONFIDENCE_THRESHOLD})")
            
            if shoplifting_predictions:
                prediction_data = {
                    'cameraId': self.camera_id,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'predictions': shoplifting_predictions
                }
                
                channel = f"{Config.CAMERA_PREDICTIONS_CHANNEL_PREFIX}{self.camera_id}"
                print(f"[REDIS] 📤 Publishing {len(shoplifting_predictions)} shoplifting prediction(s) to channel {channel}")
                self.redis_client.publish(channel, prediction_data)
                print(f"[REDIS] ✅ Published successfully for camera {self.camera_id}")
        except Exception as e:
            print(f"[ERROR] Error processing prediction: {e}")
            import traceback
            traceback.print_exc()
            self.publish_status('error', str(e))
    
    def publish_status(self, status: str, error: Optional[str] = None):
        try:
            status_data = {
                'cameraId': self.camera_id,
                'status': status,
            }
            if error:
                status_data['error'] = error
            
            channel = f"{Config.CAMERA_STATUS_CHANNEL_PREFIX}{self.camera_id}"
            print(f"[REDIS] Publishing status to channel {channel}: {json.dumps(status_data, indent=2)}")
            self.redis_client.publish(channel, status_data)
            print(f"[REDIS] Status published: {status} for camera {self.camera_id}")
        except Exception as e:
            print(f"[ERROR] Error publishing status: {e}")
    
    def start(self):
        if self.is_running:
            print(f"Stream for camera {self.camera_id} is already running")
            return
        
        try:
            self.publish_status('starting')
            
            print(f"[ROBOFLOW] Initializing pipeline for camera {self.camera_id}")
            print(f"[ROBOFLOW] Model ID: {self.model_id}")
            print(f"[ROBOFLOW] RTSP URL: {self.rtsp_url}")
            print(f"[ROBOFLOW] Max FPS: {Config.MAX_FPS}")
            print(f"[ROBOFLOW] Confidence threshold: {Config.ROBOFLOW_CONFIDENCE_THRESHOLD}")
            
            try:
                self.pipeline = InferencePipeline.init(
                    model_id=self.model_id,
                    video_reference=self.rtsp_url,
                    api_key=Config.ROBOFLOW_API_KEY,
                    on_prediction=self.on_prediction,
                    max_fps=Config.MAX_FPS,
                    confidence=Config.ROBOFLOW_CONFIDENCE_THRESHOLD
                )
                print(f"[ROBOFLOW] Pipeline initialized successfully for camera {self.camera_id}")
            except Exception as init_error:
                error_msg = f"Failed to initialize pipeline: {str(init_error)}"
                print(f"Error initializing stream for camera {self.camera_id}: {error_msg}")
                self.publish_status('error', error_msg)
                raise
            
            self.is_running = True
            
            try:
                self.pipeline.start()
                self.publish_status('active')
                print(f"Started RTSP stream for camera {self.camera_id}")
                
                self.pipeline.join()
            except Exception as stream_error:
                self.is_running = False
                error_msg = f"Stream error: {str(stream_error)}"
                print(f"Error during stream for camera {self.camera_id}: {error_msg}")
                self.publish_status('error', error_msg)
                raise
        except KeyboardInterrupt:
            self.is_running = False
            self.publish_status('stopped')
            print(f"Stream interrupted for camera {self.camera_id}")
        except Exception as e:
            self.is_running = False
            error_msg = str(e)
            print(f"Error starting stream for camera {self.camera_id}: {error_msg}")
            self.publish_status('error', error_msg)
            raise
    
    def stop(self):
        if not self.is_running and not self.pipeline:
            return
        
        try:
            self.is_running = False
            self.publish_status('stopping')
            
            if self.pipeline:
                try:
                    self.pipeline.terminate()
                except Exception as terminate_error:
                    print(f"Error terminating pipeline for camera {self.camera_id}: {terminate_error}")
                finally:
                    self.pipeline = None
            
            self.publish_status('stopped')
            print(f"Stopped stream for camera {self.camera_id}")
        except Exception as e:
            error_msg = str(e)
            print(f"Error stopping stream for camera {self.camera_id}: {error_msg}")
            self.publish_status('error', error_msg)
            if self.pipeline:
                self.pipeline = None

