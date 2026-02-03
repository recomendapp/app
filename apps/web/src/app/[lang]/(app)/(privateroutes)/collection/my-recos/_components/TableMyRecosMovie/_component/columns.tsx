'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { UserRecosMovieAggregated } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { capitalize, upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { DateOnlyYearTooltip } from '@/components/utils/Date';
import { Icons } from '@/config/icons';
import { RuntimeTooltip } from '@/components/utils/RuntimeTooltip';
import Senders from './senders';

export const Columns = (): ColumnDef<UserRecosMovieAggregated>[] => {
  const t = useTranslations();
  return [
    {
      id: 'item',
      accessorFn: (row) => row?.movie?.title,
      meta: {
        displayName: upperFirst(t('common.messages.film', { count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.film', { count: 1 }))} />
      ),
      cell: ({ row }) => <Item key={row.index} movie={row.original?.movie!} />,
      enableHiding: false,
    },
    {
      id: 'release_date',
      accessorFn: (row) => row?.movie?.release_date,
      meta: {
        displayName: upperFirst(t('common.messages.date')),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.date'))} />
      ),
      cell: ({ row }) => (
        <DateOnlyYearTooltip date={row.original?.movie?.release_date} className='text-muted-foreground'/>
      ),
    },
    {
      id: 'runtime',
      accessorFn: (row) => row?.movie?.runtime,
      meta: {
        displayName: upperFirst(t('common.messages.duration')),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} Icon={Icons.clock} />
      ),
      cell: ({ row }) => (
        <RuntimeTooltip runtime={row.original?.movie?.runtime ?? 0} className='text-muted-foreground'/>
      ),
    },
    {
      id: 'by',
      accessorFn: (row) => row?.senders?.length,
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
      cell: ({ row }) => (
        <Senders row={row} />
      ),
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
