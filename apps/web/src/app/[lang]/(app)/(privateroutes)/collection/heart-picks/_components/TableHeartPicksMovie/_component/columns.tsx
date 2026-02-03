'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { UserActivityMovie } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import { DateOnlyYearTooltip } from '@/components/utils/Date';
import { Icons } from '@/config/icons';
import { RuntimeTooltip } from '@/components/utils/RuntimeTooltip';

export const Columns = (): ColumnDef<UserActivityMovie>[] => {
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
