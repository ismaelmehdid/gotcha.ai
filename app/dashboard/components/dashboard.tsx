'use client';

import {
  Activity,
  AlertTriangle,
  Camera,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardHeader } from '../../../components/dashboard-header';
import { StatCard } from '../../../components/stat-card';
import { AnalyticsChart } from './analytics-chart';

const statsData = [
  {
    label: 'Active Cameras',
    value: 12,
    icon: Camera,
    trend: { value: 8, isPositive: true },
    description: 'All systems operational',
  },
  {
    label: 'Total Detections',
    value: 342,
    icon: Activity,
    trend: { value: 12, isPositive: true },
    description: 'Last 30 days',
  },
  {
    label: 'Alerts Today',
    value: 8,
    icon: AlertTriangle,
    trend: { value: 23, isPositive: false },
    description: 'Requires attention',
  },
  {
    label: 'Prevention Rate',
    value: '94%',
    icon: Shield,
    trend: { value: 5, isPositive: true },
    description: 'Incidents prevented',
  },
  {
    label: 'Response Time',
    value: '2.3s',
    icon: Zap,
    trend: { value: 15, isPositive: true },
    description: 'Average detection',
  },
  {
    label: 'Accuracy',
    value: '98.5%',
    icon: TrendingUp,
    trend: { value: 2, isPositive: true },
    description: 'Detection precision',
  },
];

function generateChartData() {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const baseValue = 15 + Math.random() * 20;
    const dayOfWeek = date.getDay();
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;
    const value = Math.round(baseValue * weekendMultiplier + Math.random() * 5);

    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }

  return data;
}

const chartData = generateChartData();

export function Dashboard() {
  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Security Dashboard"
        description="Real-time monitoring and analytics for your shoplifting detection system"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsData.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            description={stat.description}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart data={chartData} />
        </div>
        <div className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-md border-lime-400/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lime-400/10 border border-lime-400/20">
                    <Shield className="w-5 h-5 text-lime-400" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">System Status</div>
                    <div className="text-xl font-bold text-white">Active</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Uptime</span>
                    <span className="text-white font-medium">99.9%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border-lime-400/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lime-400/10 border border-lime-400/20">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm">Performance</div>
                    <div className="text-xl font-bold text-white">
                      Excellent
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">CPU Usage</span>
                    <span className="text-white font-medium">42%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Memory</span>
                    <span className="text-white font-medium">68%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
