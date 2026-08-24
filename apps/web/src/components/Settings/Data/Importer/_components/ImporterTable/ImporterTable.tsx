'use client';
'use no memo';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Icons } from '@/config/icons';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { cn } from '@/lib/utils';

interface InfiniteListLike<TItem> {
  data?: { pages: Array<{ data: TItem[] }> };
  isFetching: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

const FETCH_NEAR_BOTTOM_PX = 500;

const ESTIMATED_ROW_HEIGHT_PX = 88;

export function ImporterTable<TItem>({
  query,
  columns,
  isRowDimmed,
}: {
  query: InfiniteListLike<TItem>;
  columns: ColumnDef<TItem>[];
  isRowDimmed?: (item: TItem) => boolean;
}) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isFetching, isLoading, fetchNextPage, hasNextPage } = query;

  const fetchMoreOnBottomReached = useCallback(
    (container?: HTMLDivElement | null) => {
      if (!container) return;
      const { scrollHeight, scrollTop, clientHeight } = container;
      if (
        scrollHeight - scrollTop - clientHeight < FETCH_NEAR_BOTTOM_PX &&
        !isFetching &&
        hasNextPage
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, isFetching, hasNextPage],
  );

  useEffect(() => {
    fetchMoreOnBottomReached(containerRef.current);
  }, [fetchMoreOnBottomReached]);

  const flatData = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const table = useReactTable<TItem>({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT_PX,
    getScrollElement: () => containerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <div
      ref={containerRef}
      onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}
      className="relative overflow-auto h-[70vh]"
    >
      <table className="grid w-full text-sm">
        <thead className="grid sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="flex w-full border-b bg-background">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ flex: `${header.getSize()} 0 0%`, minWidth: 0 }}
                  className={cn(
                    'flex items-center h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                    header.column.id === 'actions' && 'justify-end',
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        {rows.length ? (
          <tbody className="grid relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={(node) => rowVirtualizer.measureElement(node)}
                  className={cn(
                    'flex absolute w-full border-b transition-colors hover:bg-muted/50',
                    isRowDimmed?.(row.original) && 'opacity-40',
                  )}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ flex: `${cell.column.getSize()} 0 0%`, minWidth: 0 }}
                      className={cn(
                        'flex items-center p-4',
                        cell.column.id === 'actions' && 'justify-end',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        ) : !isLoading ? (
          <tbody className="grid">
            <tr className="flex w-full">
              <td className="flex h-24 flex-1 items-center justify-center text-muted-foreground">
                {upperFirst(t('common.messages.no_results'))}
              </td>
            </tr>
          </tbody>
        ) : null}
      </table>
      {isFetching && (
        <div className="flex items-center justify-center p-4">
          <Icons.loader />
        </div>
      )}
    </div>
  );
}
