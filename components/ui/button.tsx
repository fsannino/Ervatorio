import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academic disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-ink text-paper hover:opacity-90',
        outline: 'border border-rule bg-transparent text-ink hover:bg-paper',
        ghost: 'text-ink hover:bg-paper',
        accent: 'bg-accent text-white hover:opacity-90',
        gold: 'bg-gold text-ink hover:opacity-90',
        link: 'text-academic underline-offset-4 hover:underline',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5',
        lg: 'px-7 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
