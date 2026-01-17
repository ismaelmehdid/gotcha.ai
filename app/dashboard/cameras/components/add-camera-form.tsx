'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AddCameraFormProps {
  onAdd: (camera: { name: string; location: string; rtspUrl: string }) => void;
}

export function AddCameraForm({ onAdd }: AddCameraFormProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rtspUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || undefined,
          rtspUrl: rtspUrl.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create camera');
      }

      const camera = await response.json();
      await onAdd(camera);
      setName('');
      setLocation('');
      setRtspUrl('');
    } catch (error) {
      console.error('Error creating camera:', error);
      alert(error instanceof Error ? error.message : 'Failed to create camera');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border-lime-400/30">
      <CardHeader>
        <CardTitle className="text-white">Add Camera</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="camera-name"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Camera Name *
            </label>
            <Input
              id="camera-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Entrance"
              required
              className="bg-black/50 border-lime-400/30 text-white"
            />
          </div>

          <div>
            <label
              htmlFor="camera-location"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              Location
            </label>
            <Input
              id="camera-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Store Floor 1"
              className="bg-black/50 border-lime-400/30 text-white"
            />
          </div>

          <div>
            <label
              htmlFor="rtsp-url"
              className="block text-sm font-medium text-white/70 mb-2"
            >
              RTSP URL *
            </label>
            <Input
              id="rtsp-url"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="e.g., rtsp://4.tcp.eu.ngrok.io:17931/webcam"
              required
              className="bg-black/50 border-lime-400/30 text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !rtspUrl.trim()}
            className="w-full bg-lime-500/20 border border-lime-400/50 text-white hover:bg-lime-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Camera'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
