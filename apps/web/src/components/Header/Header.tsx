import { cn } from '@/lib/utils';
import HeaderLeftSide from './HeaderLeftSide';
import HeaderRightSide from './HeaderRightSide';

export const Header = ({
  className,
  ...props
} : React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <header className={cn(
      "sticky top-0 z-10 bg-background flex p-4 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
      className
    )}
    {...props}
    >
      <HeaderLeftSide />
      <HeaderRightSide />
    </header>
  );
}
