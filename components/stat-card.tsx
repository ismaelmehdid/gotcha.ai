import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/5 backdrop-blur-md border-lime-400/30',
        className,
      )}
    >
      <CardContent className="p-6 space-y-2">
        <div className="text-white/70 text-sm font-medium">{label}</div>
        <div className="text-3xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}
