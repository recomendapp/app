'use client';

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { capitalize } from 'lodash';

interface TableSortOptionsProps<TData> {
  table: Table<TData>;
}

export function TableSortOptions<TData>({
  table,
}: TableSortOptionsProps<TData>) {
  const t = useTranslations();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex h-8 lg:hidden"
        >
          <Filter className="mr-2 h-4 w-4" />
          {capitalize(t('common.messages.sort'))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>{capitalize(t('common.messages.sort_by'))}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanSort()
          )
          .map((column) => {
            return (
              <DropdownMenuItem
                key={column.id}
                onClick={() => column.toggleSorting()}
              >
                {column.columnDef.meta?.displayName}
                {{
                  asc: <ChevronUp className=" ml-2 h-4 w-4 text-accent-yellow" />,
                  desc: <ChevronDown className=" ml-2 h-4 w-4 text-accent-yellow" />,
                }[column.getIsSorted() as string] ?? null}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
