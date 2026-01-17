import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    
    ROBOFLOW_API_KEY = os.getenv('ROBOFLOW_API_KEY')
    if not ROBOFLOW_API_KEY:
        raise ValueError('ROBOFLOW_API_KEY environment variable is not set')
    
    ROBOFLOW_MODEL_ID = os.getenv('ROBOFLOW_MODEL_ID')
    if not ROBOFLOW_MODEL_ID:
        raise ValueError('ROBOFLOW_MODEL_ID environment variable is not set')
    
    ROBOFLOW_CONFIDENCE_THRESHOLD = float(os.getenv('ROBOFLOW_CONFIDENCE_THRESHOLD', '0.5'))
    
    CAMERA_COMMANDS_CHANNEL = 'camera:commands'
    CAMERA_PREDICTIONS_CHANNEL_PREFIX = 'camera:predictions:'
    CAMERA_STATUS_CHANNEL_PREFIX = 'camera:status:'
    
    MAX_FPS = int(os.getenv('ROBOFLOW_MAX_FPS', '5'))


