import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  as?: React.ElementType;
}

export function Container({ children, className, narrow = false, as: Tag = 'div' }: ContainerProps) {
  return (
    <Tag className={cn(narrow ? 'container-content' : 'container-site', className)}>
      {children}
    </Tag>
  );
}
