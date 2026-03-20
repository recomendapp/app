'use client';
'use no memo';

import * as React from 'react';
import {
  ColumnFiltersState,
  Row,
  RowData,
  SortingState,
  Table as TableType,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Columns } from './component/columns';
import { useMediaQuery } from 'react-responsive';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { MouseSensor, TouchSensor } from '@/lib/dnd-kit/CustomSensor';
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { DataTableToolbar } from './component/data-table-toolbar';
import { useAuth } from '@/context/auth-context';
import { PlaylistItemWithMedia, PlaylistWithOwner } from '@packages/api-js';
import { usePlaylist } from '@/hooks/use-playlist';
import { usePlaylistItemUpdateMutation } from '@libs/query-client';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    displayName: string;
  }
}

interface DataTableProps {
  playlist: PlaylistWithOwner;
  items: PlaylistItemWithMedia[];
  // setPlaylistItems: React.Dispatch<React.SetStateAction<PlaylistItemMovie[]>>;
}

export default function PlaylistTable({
  playlist,
  items: itemsProp,
}: DataTableProps) {
  const common = useTranslations('common');
  const { canEdit } = usePlaylist({
    playlistId: playlist.id,
  })
  // Mutations
  const { mutateAsync: updateItem } = usePlaylistItemUpdateMutation();

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const items = React.useMemo<UniqueIdentifier[]>(() => itemsProp?.map((item) => item.id), [itemsProp]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState();
 
  const table = useReactTable({
    data: itemsProp,
    columns: Columns(),
    initialState: {
      pagination: {
        pageSize: 1001,
      },
    },
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const isMobile = useMediaQuery({ maxWidth: 1024 });
  React.useEffect(() => {
    if (isMobile) {
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== 'undefined' && column.getCanHide()
        )
        .forEach((column) => {
          column.toggleVisibility(false);
        });
    } else {
      table
        .getAllColumns()
        .filter(
          (column) =>
            typeof column.accessorFn !== 'undefined' && column.getCanHide()
        )
        .forEach((column) => {
          column.toggleVisibility(true);
        });
    }
  }, [isMobile, table]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 350,
        tolerance: 200,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 350,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = React.useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.id !== over?.id) {
      const newIndex = items.indexOf(over.id);
      await updateItem({
        path: {
          playlist_id: playlist.id,
          item_id: Number(active.id),
        },
        body: {
          position: newIndex + 1,
        },
      }, {
        onError: () => {
          toast.error(upperFirst(common('messages.an_error_occurred')));
        }
      });
    }
    setActiveId(null);
  }, [updateItem, playlist.id, items, common]);

  const handleDragCancel = React.useCallback(() => {
    setActiveId(null);
  }, []);

  const rowData = table?.getRowModel().rows;

  const selectedRow = React.useMemo(() => {
    if (!activeId) {
      return null;
    }
    const row = rowData.find(({ original }) => original?.id === activeId);
    // prepareRow(row);
    return row;
  }, [activeId, rowData]);

  return (
    <div className="flex flex-col gap-2 mx-4">
      <DataTableToolbar table={table} playlist={playlist} />
      <div className="rounded-md">
        {(canEdit && !sorting.length && !globalFilter && !columnFilters.length) ? (
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
          >
            <TableContainer table={table} items={items} />
            <DragOverlay>
              {activeId && (
                <Table style={{ width: "100%" }}>
                  <TableBody>
                    <StaticTableRow row={selectedRow} />
                  </TableBody>
                </Table>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <TableContainer table={table} items={items} />
        )}
      </div>
    </div>
  );
}

const TableContainer = ({
  table,
  items,
} : {
  table: TableType<PlaylistItemWithMedia>;
  items: UniqueIdentifier[];
}) => {
  const common = useTranslations('common');
  return (
  <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header, index) => (
              <TableHead key={header.id} className={!index ? 'pr-0' : ''}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
              ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {table.getRowModel().rows.map((row) => (
              <DraggableTableRow key={row.original?.id} row={row} />
            ))}
          </SortableContext>
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
            {upperFirst(common('messages.no_results'))}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

const DraggableTableRow = ({
  row,
} : {
  row: Row<PlaylistItemWithMedia>;
}) => {
  const { canEdit } = usePlaylist({
    playlistId: row.original.playlistId,
  });
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging
  } = useSortable({
    id: row.original.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition
  };

  return (
    <TableRow ref={setNodeRef} style={style} className='group'>
      {isDragging ? (
        <TableCell className='bg-accent-yellow h-28' colSpan={row.getVisibleCells().length}>&nbsp;</TableCell>
      ) : (
        row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            {...attributes}
            {...listeners}
            className={`${canEdit ? 'cursor-grab' : 'cursor-default'}`}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))
      )}
    </TableRow>
  );
};

export const StaticTableRow = ({ row } : { row:  Row<PlaylistItemWithMedia> | null | undefined}) => {
  return (
    <TableRow className='bg-background'>
      {row?.getVisibleCells().map((cell, i) => {
          if (i === 0) {
            return (
              <TableCell key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </TableCell>
            );
          }
          return (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          );
      })}
    </TableRow>
  )
}
