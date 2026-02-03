'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { PlaylistItemTvSeries } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { DataComment } from './comment';

export const Columns = (): ColumnDef<PlaylistItemTvSeries>[] => {
  const t = useTranslations();
  return [
    {
      id: 'rank',
      accessorFn: (row) => row?.rank,
      header: ({ column }) => (
        <TableColumnHeader column={column} title="#"/>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground text-center w-fit font-bold">
          {Number(row.id) + 1}
        </div>
      ),
      enableHiding: false,
      enableResizing: false,
      size: 4,
      maxSize: 10,
      minSize: 10,
    },
    {
      id: 'item',
      accessorFn: (row) => row?.tv_series?.name,
      meta: {
        displayName: upperFirst(t('common.messages.tv_series', { count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.tv_series', { count: 1 }))} />
      ),
      cell: ({ row }) => <Item key={row.index} tvSeries={row.original.tv_series!} />,
      enableHiding: false,
    },
    {
      accessorKey: 'comment',
      meta: {
        displayName: upperFirst(t('common.messages.comment', {count: 1})),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.comment', {count: 1}))} />
      ),
      cell: ({ row }) => <DataComment playlistItem={row.original} />,
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
