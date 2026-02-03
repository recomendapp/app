'use client';

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import { capitalize } from 'lodash';

interface TableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function TableViewOptions<TData>({
  table,
}: TableViewOptionsProps<TData>) {
  const t = useTranslations();
  return (
	<DropdownMenu>
	  <DropdownMenuTrigger asChild>
		<Button
		  variant="outline"
		  size="sm"
		  className="ml-auto hidden h-8 lg:flex"
		>
		  <MixerHorizontalIcon className="mr-2 h-4 w-4" />
		  {capitalize(t('common.messages.show'))}
		</Button>
	  </DropdownMenuTrigger>
	  <DropdownMenuContent align="end" className="w-[150px]">
		<DropdownMenuLabel>{capitalize(t('common.messages.column', {count:2}))}</DropdownMenuLabel>
		<DropdownMenuSeparator />
		{table
		  .getAllColumns()
		  .filter(
			(column) =>
			  typeof column.accessorFn !== 'undefined' && column.getCanHide()
		  )
		  .map((column) => {
			return (
			  <DropdownMenuCheckboxItem
				key={column.id}
				checked={column.getIsVisible()}
				onCheckedChange={(value) => column.toggleVisibility(!!value)}
			  >
				{column.columnDef.meta?.displayName}
			  </DropdownMenuCheckboxItem>
			);
		  })}
	  </DropdownMenuContent>
	</DropdownMenu>
  );
}
