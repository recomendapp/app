'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { Item } from './item';
import { upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { DateOnlyYearTooltip } from '@/components/utils/Date';
import { BookmarkWithMedia } from './types';
import { Comment } from './comment';

export const Columns = (): ColumnDef<BookmarkWithMedia>[] => {
  const t = useTranslations();
  const formatter = useFormatter();
  const now = useNow();
  return [
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
      enableSorting: false,
    },
    {
      id: 'created_at',
      accessorFn: (row) => row.createdAt,
      meta: {
        displayName: upperFirst(t('common.messages.added_at', { gender: 'male', count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.added_at', { gender: 'male', count: 1 }))} />
      ),
      cell: ({ row }) => (
        <DateOnlyYearTooltip date={row.original?.createdAt} className='text-muted-foreground'>
          {formatter.relativeTime(new Date(row.original?.createdAt), { now })}
        </DateOnlyYearTooltip>
      ),
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
      cell: ({ row }) => <Comment data={row.original} />,
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
