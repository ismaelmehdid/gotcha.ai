'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
  className?: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.getDate().toString();
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataPoint;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-sm border border-lime-400/30 rounded-lg px-3 py-2">
        <p className="text-lime-400 text-sm font-medium">
          {`${payload[0]?.value ?? 0} detections`}
        </p>
        <p className="text-white/60 text-xs">
          {new Date(payload[0]?.payload.date ?? '').toLocaleDateString()}
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsChart({ data, className }: AnalyticsChartProps) {
  return (
    <Card
      className={cn(
        'bg-white/5 backdrop-blur-md border-lime-400/30',
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-white">Analytics (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="rgb(163, 230, 53)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="rgb(163, 230, 53)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.1)"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="rgba(255, 255, 255, 0.6)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="rgba(255, 255, 255, 0.6)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(163, 230, 53)"
                strokeWidth={2}
                fill="url(#colorValue)"
                dot={{ fill: 'rgb(163, 230, 53)', r: 3 }}
                activeDot={{ r: 5, fill: 'rgb(163, 230, 53)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
