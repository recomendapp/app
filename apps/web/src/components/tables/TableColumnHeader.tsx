import {
  CaretSortIcon,
} from '@radix-ui/react-icons';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, LucideIcon, Triangle } from 'lucide-react';

interface TableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title?: string;
  Icon?: LucideIcon;
}

export function TableColumnHeader<TData, TValue>({
  column,
  title,
  Icon,
  className,
}: TableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
	return <div className={cn(className)}>{title}</div>;
  }

  return (
	<div className={cn('flex items-center space-x-2', className)}>
	  <Button
		variant="ghost"
		size="sm"
		className="-ml-3 h-8 data-[state=open]:bg-muted whitespace-nowrap"
		onClick={() => column.toggleSorting()}
	  >
		{title && <span>{title}</span>}
		{Icon && <Icon />}
		{{
		  asc: <ChevronUp className=" ml-2 h-4 w-4 text-accent-yellow" />,
		  desc: <ChevronDown className=" ml-2 h-4 w-4 text-accent-yellow" />,
		}[column.getIsSorted() as string] ?? (
		  <CaretSortIcon className="ml-2 h-4 w-4" />
		)}
	  </Button>
	</div>
  );
}
