import signal
import sys
import threading
import json
from typing import Dict, Optional
from stream_handler import StreamHandler
from redis_client import RedisClient
from config import Config

class PythonWorker:
    def __init__(self):
        self.redis_client = RedisClient()
        self.active_streams: Dict[str, StreamHandler] = {}
        self.running = True
        self.command_thread: Optional[threading.Thread] = None
    
    def handle_command(self, command: dict):
        print(f"[PYTHON-WORKER] Received command: {json.dumps(command, indent=2)}")
        try:
            action = command.get('action')
            camera_id = command.get('cameraId')
            
            if not action or not camera_id:
                print(f"[PYTHON-WORKER] Invalid command: missing action or cameraId: {command}")
                return
            
            print(f"[PYTHON-WORKER] Processing command: action={action}, cameraId={camera_id}")
            
            if action == 'start':
                self.start_stream(command)
            elif action == 'stop':
                self.stop_stream(camera_id)
            else:
                print(f"[PYTHON-WORKER] Unknown action: {action}")
        except Exception as e:
            print(f"[PYTHON-WORKER] Error handling command: {e}")
            import traceback
            traceback.print_exc()
    
    def start_stream(self, command: dict):
        camera_id = command.get('cameraId')
        print(f"[PYTHON-WORKER] Starting stream for camera {camera_id}")
        
        if camera_id in self.active_streams:
            print(f"[PYTHON-WORKER] Stream for camera {camera_id} is already active")
            return
        
        try:
            rtsp_url = command.get('rtspUrl')
            camera_name = command.get('cameraName', 'Unknown')
            camera_location = command.get('cameraLocation')
            model_id = command.get('modelId', Config.ROBOFLOW_MODEL_ID)
            
            print(f"[PYTHON-WORKER] Stream configuration:")
            print(f"[PYTHON-WORKER]   Camera ID: {camera_id}")
            print(f"[PYTHON-WORKER]   Camera Name: {camera_name}")
            print(f"[PYTHON-WORKER]   Camera Location: {camera_location}")
            print(f"[PYTHON-WORKER]   RTSP URL: {rtsp_url}")
            print(f"[PYTHON-WORKER]   Model ID: {model_id}")
            
            if not rtsp_url:
                print(f"[PYTHON-WORKER] Missing rtspUrl for camera {camera_id}")
                return
            
            print(f"[PYTHON-WORKER] Creating StreamHandler...")
            handler = StreamHandler(
                camera_id=camera_id,
                rtsp_url=rtsp_url,
                camera_name=camera_name,
                camera_location=camera_location,
                model_id=model_id,
                redis_client=self.redis_client
            )
            
            self.active_streams[camera_id] = handler
            
            def run_stream():
                try:
                    print(f"[PYTHON-WORKER] Stream thread started for camera {camera_id}")
                    handler.start()
                except Exception as e:
                    print(f"[PYTHON-WORKER] Stream error for camera {camera_id}: {e}")
                    import traceback
                    traceback.print_exc()
                finally:
                    if camera_id in self.active_streams:
                        del self.active_streams[camera_id]
                    print(f"[PYTHON-WORKER] Stream thread finished for camera {camera_id}")
            
            stream_thread = threading.Thread(target=run_stream, daemon=True)
            stream_thread.start()
            
            print(f"[PYTHON-WORKER] Started stream handler for camera {camera_id}")
        except Exception as e:
            print(f"[PYTHON-WORKER] Error starting stream for camera {camera_id}: {e}")
            import traceback
            traceback.print_exc()
            if camera_id in self.active_streams:
                del self.active_streams[camera_id]
    
    def stop_stream(self, camera_id: str):
        print(f"[PYTHON-WORKER] Stopping stream for camera {camera_id}")
        
        if camera_id not in self.active_streams:
            print(f"[PYTHON-WORKER] No active stream found for camera {camera_id}")
            return
        
        try:
            handler = self.active_streams[camera_id]
            print(f"[PYTHON-WORKER] Calling handler.stop() for camera {camera_id}")
            handler.stop()
            del self.active_streams[camera_id]
            print(f"[PYTHON-WORKER] Stopped stream for camera {camera_id}")
        except Exception as e:
            print(f"[PYTHON-WORKER] Error stopping stream for camera {camera_id}: {e}")
            import traceback
            traceback.print_exc()
            if camera_id in self.active_streams:
                del self.active_streams[camera_id]
    
    def listen_for_commands(self):
        print(f"Listening for commands on channel: {Config.CAMERA_COMMANDS_CHANNEL}")
        retry_count = 0
        max_retries = 5
        retry_delay = 5
        
        while self.running:
            try:
                self.redis_client.subscribe(Config.CAMERA_COMMANDS_CHANNEL, self.handle_command)
            except KeyboardInterrupt:
                print("Command listener interrupted")
                break
            except Exception as e:
                retry_count += 1
                if retry_count <= max_retries:
                    print(f"Error in command listener (attempt {retry_count}/{max_retries}): {e}")
                    print(f"Retrying in {retry_delay}s...")
                    import time
                    time.sleep(retry_delay)
                    try:
                        self.redis_client = RedisClient()
                    except Exception as reconnect_error:
                        print(f"Failed to reconnect: {reconnect_error}")
                else:
                    print(f"Failed to listen for commands after {max_retries} attempts")
                    raise
    
    def start(self):
        print("Python RTSP Worker starting...")
        print(f"Redis: {Config.REDIS_HOST}:{Config.REDIS_PORT}")
        print(f"Roboflow Model ID: {Config.ROBOFLOW_MODEL_ID}")
        
        self.command_thread = threading.Thread(target=self.listen_for_commands, daemon=True)
        self.command_thread.start()
        
        try:
            while self.running:
                signal.pause()
        except KeyboardInterrupt:
            print("\nShutting down Python worker...")
            self.shutdown()
    
    def shutdown(self):
        self.running = False
        
        print("Stopping all active streams...")
        camera_ids = list(self.active_streams.keys())
        for camera_id in camera_ids:
            try:
                self.stop_stream(camera_id)
            except Exception as e:
                print(f"Error stopping camera {camera_id} during shutdown: {e}")
        
        self.redis_client.close()
        print("Python worker shut down complete")

def main():
    worker = PythonWorker()
    
    def signal_handler(sig, frame):
        print("\nReceived interrupt signal")
        worker.shutdown()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        worker.start()
    except Exception as e:
        print(f"Fatal error: {e}")
        worker.shutdown()
        sys.exit(1)

if __name__ == '__main__':
    main()

