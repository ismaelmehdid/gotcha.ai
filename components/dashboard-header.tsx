import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn('border-b border-lime-400/30 pb-6', className)}>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {description && (
        <p className="text-sm text-white/70 mt-2">{description}</p>
      )}
    </div>
  );
}
