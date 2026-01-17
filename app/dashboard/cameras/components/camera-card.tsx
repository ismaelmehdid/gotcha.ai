'use client';

import { Power, PowerOff, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CameraDTO } from '@/application/dto-types/camera-dto';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CameraCardProps {
  camera: CameraDTO;
  onUpdate: () => void;
}

export function CameraCard({ camera, onUpdate }: CameraCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = camera.status === 'active' || camera.status === 'starting';
  const isInactive =
    camera.status === 'inactive' || camera.status === 'stopping';

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive || isLoading) {
        onUpdate();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, isLoading, onUpdate]);

  const handleStart = async () => {
    if (isLoading || isActive) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cameras/${camera.id}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start camera');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
      console.error('Error starting camera:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (isLoading || isInactive) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cameras/${camera.id}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop camera');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop camera');
      console.error('Error stopping camera:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border-lime-400/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="w-5 h-5" />
              {camera.name}
            </CardTitle>
            {camera.location && (
              <p className="text-sm text-white/50 mt-1">{camera.location}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 uppercase">
              {camera.status}
            </span>
            <div
              className={`w-3 h-3 rounded-full ${
                isActive ? 'bg-lime-400 animate-pulse' : 'bg-white/30'
              }`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-white/70">
          <p>
            <span className="font-medium">RTSP URL:</span> {camera.rtspUrl}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 text-sm p-3">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {!isActive ? (
            <Button
              onClick={handleStart}
              disabled={isLoading || !isInactive}
              className="flex-1 bg-lime-500/20 border border-lime-400/50 text-white hover:bg-lime-500/30"
            >
              <Power className="w-4 h-4 mr-2" />
              {isLoading ? 'Starting...' : 'Start Stream'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 bg-red-500/20 border border-red-500/50 text-white hover:bg-red-500/30"
            >
              <PowerOff className="w-4 h-4 mr-2" />
              {isLoading ? 'Stopping...' : 'Stop Stream'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
