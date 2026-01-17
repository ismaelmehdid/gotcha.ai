import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const glassButtonVariants = cva(
  'relative cursor-pointer transition-all duration-300 border backdrop-blur-md font-medium text-white',
  {
    variants: {
      size: {
        default: 'px-6 py-3.5 text-base',
        sm: 'px-4 py-2 text-sm',
        lg: 'px-8 py-4 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, ...props }, ref) => {
    return (
      <button
        className={cn(
          glassButtonVariants({ size }),
          'border-lime-400/30 bg-white/10 hover:bg-white/20 hover:border-lime-400/50',
          'shadow-[0_8px_32px_0_rgba(163,230,53,0.15)] hover:shadow-[0_12px_40px_0_rgba(163,230,53,0.25)]',
          'hover:-translate-y-0.5 active:translate-y-0',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  },
);
GlassButton.displayName = 'GlassButton';

export { GlassButton, glassButtonVariants };
