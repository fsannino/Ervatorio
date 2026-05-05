import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <hr
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'w-full border-0 border-t' : 'h-full border-0 border-l',
        className
      )}
      style={{ borderColor: 'var(--color-rule)' }}
      {...props}
    />
  );
}

export { Separator };
