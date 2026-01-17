import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/5 backdrop-blur-md border-lime-400/30 hover:border-lime-400/50 transition-all duration-300 group relative overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-6 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-lg bg-lime-400/10 border border-lime-400/20 group-hover:bg-lime-400/20 group-hover:border-lime-400/30 transition-colors duration-300">
            <Icon className="w-5 h-5 text-lime-400" />
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                trend.isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400',
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-white/70 text-sm font-medium">{label}</div>
          <div className="text-4xl font-bold text-white tracking-tight">
            {value}
          </div>
          {description && (
            <div className="text-white/50 text-xs mt-1">{description}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
