'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { UserRecosTvSeriesAggregated } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { capitalize, upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';
import Senders from './senders';

export const Columns = (): ColumnDef<UserRecosTvSeriesAggregated>[] => {
  const t = useTranslations();
  return [
    {
      id: 'item',
      accessorFn: (row) => row?.tv_series?.name,
      meta: {
        displayName: upperFirst(t('common.messages.film', { count: 1 })),
      },
      header: ({ column }) => (
        <TableColumnHeader column={column} title={upperFirst(t('common.messages.film', { count: 1 }))} />
      ),
      cell: ({ row }) => <Item key={row.index} tvSeries={row.original?.tv_series!} />,
      enableHiding: false,
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
