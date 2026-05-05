import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded border bg-chalk px-3 py-2 text-sm placeholder:text-footnote',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-academic',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    style={{ borderColor: 'var(--color-rule)', color: 'var(--color-ink)', fontFamily: 'var(--font-dm-sans)' }}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
