'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { Item } from './item';
import { capitalize, upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { DateOnlyYearTooltip } from '@/components/utils/Date';
import { RecoWithMedia } from './types';
import Senders from './senders';

export const Columns = (): ColumnDef<RecoWithMedia>[] => {
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
      accessorFn: (row) => row.latestCreatedAt,
      meta: {
        displayName: upperFirst(t('common.messages.added_at', { gender: 'male', count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.added_at', { gender: 'male', count: 1 }))} />
      ),
      cell: ({ row }) => (
        <DateOnlyYearTooltip date={row.original.latestCreatedAt} className='text-muted-foreground'>
          {formatter.relativeTime(new Date(row.original.latestCreatedAt), { now })}
        </DateOnlyYearTooltip>
      ),
    },
    {
      id: 'by',
      accessorFn: (row) => row.senders.length,
      meta: {
        displayName: upperFirst(t('common.messages.added_by')),
      },
      header: ({ column }) => (
        <TableColumnHeader
        column={column}
        title={capitalize(t('common.messages.added_by'))}
        className="justify-end hidden lg:block"
        />
      ),
      cell: ({ row }) => <Senders row={row} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions data={row.original} />
      ),
    },
  ];
};
