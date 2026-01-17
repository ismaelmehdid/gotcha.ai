'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard-header';
import { AddCameraForm } from './add-camera-form';
import { CameraCard } from './camera-card';
import type { CameraDTO } from '@/application/dto-types/camera-dto';

export function Cameras() {
  const [cameras, setCameras] = useState<CameraDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCameras = async () => {
    try {
      const response = await fetch('/api/cameras');
      if (response.ok) {
        const data = await response.json();
        setCameras(data);
      }
    } catch (error) {
      console.error('Error fetching cameras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  const handleAddCamera = () => {
    fetchCameras();
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Cameras"
        description="Manage your surveillance cameras"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <AddCameraForm onAdd={handleAddCamera} />
        </div>

        {isLoading ? (
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-md border border-lime-400/30 p-12 text-center">
              <p className="text-white/70">Loading cameras...</p>
            </div>
          </div>
        ) : cameras.length === 0 ? (
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-md border border-lime-400/30 p-12 text-center">
              <p className="text-white/70">No cameras configured yet</p>
            </div>
          </div>
        ) : (
          cameras.map((camera) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              onUpdate={fetchCameras}
            />
          ))
        )}
      </div>
    </div>
  );
}
