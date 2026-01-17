'use client';
import { DashboardHeader } from '@/components/dashboard-header';
import { Card, CardContent } from '@/components/ui/card';

export function Cameras() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Cameras"
        description="Manage your surveillance cameras"
      />

      <Card className="bg-white/5 backdrop-blur-md border-lime-400/30">
        <CardContent className="p-12 text-center">
          <p className="text-white/70">No cameras configured yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
