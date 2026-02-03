'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { UserWatchlistTvSeries } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { Comment } from './comment';

export const Columns = (): ColumnDef<UserWatchlistTvSeries>[] => {
  const t = useTranslations();
  return [
    {
      id: 'item',
      accessorFn: (row) => row?.tv_series?.name,
      meta: {
        displayName: upperFirst(t('common.messages.tv_series', { count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.tv_series', { count: 1 }))} />
      ),
      cell: ({ row }) => <Item key={row.index} tvSeries={row.original?.tv_series!} />,
      enableHiding: false,
    },
    {
      id: 'comment',
      accessorKey: 'comment',
      meta: {
        displayName: upperFirst(t('common.messages.comment', { count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.comment', { count: 1 }))} />
      ),
      cell: ({ row }) => <Comment watchlistItem={row.original} />,
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: ({ row, table, column }) => (
        <DataTableRowActions
          data={row.original}
          table={table}
          row={row}
          column={column}
        />
      ),
    },
  ];
};
