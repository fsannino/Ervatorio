import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-ink text-paper',
        gold: 'text-ink',
        outline: 'border',
        forest: 'text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const variantStyles: React.CSSProperties =
    variant === 'gold'
      ? { background: 'var(--color-gold)', ...style }
      : variant === 'outline'
      ? { borderColor: 'var(--color-rule)', color: 'var(--color-footnote)', ...style }
      : variant === 'forest'
      ? { background: 'var(--color-forest)', ...style }
      : style ?? {};

  return <div className={cn(badgeVariants({ variant, className }))} style={variantStyles} {...props} />;
}

export { Badge, badgeVariants };
