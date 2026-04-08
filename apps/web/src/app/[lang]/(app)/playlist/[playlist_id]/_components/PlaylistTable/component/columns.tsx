'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { DataComment } from './comment';
import { PlaylistItemWithMedia } from '@libs/api-js';

export const Columns = (): ColumnDef<PlaylistItemWithMedia>[] => {
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
      accessorFn: (row) => {
        switch (row.type) {
          case 'movie':
            return row.media.title;
          case 'tv_series':
            return row.media.name;
        }
      },
      meta: {
        displayName: upperFirst(t('common.messages.item', { count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.item', { count: 1 }))} />
      ),
      cell: ({ row }) => <Item key={row.index} data={row.original} />,
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
      cell: ({ row }) => <DataComment data={row.original} />,
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
