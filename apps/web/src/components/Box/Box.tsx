import { cn } from '@/lib/utils';

//* Define the props interface for the Box component.
interface BoxProps {
  children: React.ReactNode;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(`
          bg-background
          lg:rounded-lg
          p-2
        `,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
