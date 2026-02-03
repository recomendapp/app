'use client';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { UserActivityTvSeries } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { Item } from './item';
import { upperFirst } from 'lodash';
import { TableColumnHeader } from '@/components/tables/TableColumnHeader';

export const Columns = (): ColumnDef<UserActivityTvSeries>[] => {
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
