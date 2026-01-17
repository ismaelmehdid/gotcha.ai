import json
import time
import redis
from typing import Callable, Optional
from config import Config

class RedisClient:
    def __init__(self):
        self._retry_delay = 1
        self._max_retry_delay = 60
        self._max_retries = 5
        self.client = None
        self.pubsub = None
        self._connect()
    
    def _connect(self):
        try:
            self.client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                password=Config.REDIS_PASSWORD,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            self.client.ping()
            self.pubsub = self.client.pubsub()
        except Exception as e:
            print(f"Failed to connect to Redis: {e}")
            raise
    
    def _ensure_connection(self, retries=0):
        try:
            if self.client:
                self.client.ping()
            else:
                self._connect()
        except (redis.ConnectionError, redis.TimeoutError, AttributeError) as e:
            if retries < self._max_retries:
                delay = min(self._retry_delay * (2 ** retries), self._max_retry_delay)
                print(f"Redis connection lost, retrying in {delay}s... (attempt {retries + 1}/{self._max_retries})")
                time.sleep(delay)
                try:
                    self._connect()
                except Exception:
                    return self._ensure_connection(retries + 1)
            else:
                print(f"Failed to reconnect to Redis after {self._max_retries} attempts")
                raise
    
    def publish(self, channel: str, data: dict, retries=0):
        try:
            self._ensure_connection()
            self.client.publish(channel, json.dumps(data))
        except Exception as e:
            if retries < self._max_retries:
                delay = min(self._retry_delay * (2 ** retries), self._max_retry_delay)
                print(f"Publish failed, retrying in {delay}s... (attempt {retries + 1}/{self._max_retries})")
                time.sleep(delay)
                return self.publish(channel, data, retries + 1)
            print(f"Error publishing to {channel}: {e}")
            raise
    
    def subscribe(self, channel: str, callback: Callable[[dict], None]):
        try:
            self._ensure_connection()
            self.pubsub.subscribe(channel)
            
            for message in self.pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        callback(data)
                    except json.JSONDecodeError as e:
                        print(f"Error decoding message: {e}")
                    except Exception as e:
                        print(f"Error in callback: {e}")
        except Exception as e:
            print(f"Error subscribing to {channel}: {e}")
            raise
    
    def unsubscribe(self, channel: str):
        try:
            self.pubsub.unsubscribe(channel)
        except Exception as e:
            print(f"Error unsubscribing from {channel}: {e}")
    
    def close(self):
        try:
            self.pubsub.close()
            self.client.close()
        except Exception as e:
            print(f"Error closing Redis connection: {e}")

