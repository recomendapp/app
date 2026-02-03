'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { TableViewOptions } from './TableViewOptions';
import { TableSortOptions } from './TableSortOptions';

interface TableToolbarProps<TData> {
  table: Table<TData>;
  searchPlaceholder?: string;
}

export function TableToolbar<TData>({
  table,
  searchPlaceholder,
}: TableToolbarProps<TData>) {
  const t = useTranslations();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
	<div className="flex items-center justify-between gap-4">
	  <div className="flex flex-1 items-center gap-2">
		<Input
		  placeholder={searchPlaceholder ?? upperFirst(t('common.messages.search'))}
		  value={
			(table.getColumn('item')?.getFilterValue() as string) ??
			''
		  }
		  onChange={(event) =>
			table
			  .getColumn('item')
			  ?.setFilterValue(event.target.value)
		  }
		  className="h-8 w-full lg:w-[250px]"
		/>
		{isFiltered && (
		  <Button
			variant="ghost"
			onClick={() => table.resetColumnFilters()}
			className="h-8 px-2 lg:px-3"
		  >
			{upperFirst(t('common.messages.cancel'))}
			<Cross2Icon className="ml-2 h-4 w-4" />
		  </Button>
		)}
	  </div>
	  <TableSortOptions table={table} />
	  <TableViewOptions table={table} />
	</div>
  );
}
