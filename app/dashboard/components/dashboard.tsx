'use client';

import { DashboardHeader } from '../../../components/dashboard-header';
import { StatCard } from '../../../components/stat-card';

const statsData = [
  { label: 'Active Cameras', value: 0 },
  { label: 'Total Detections', value: 0 },
  { label: 'Alerts Today', value: 0 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Dashboard"
        description="Overview of your shoplifting detection system"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </div>
  );
}
