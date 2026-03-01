'use client';
'use no memo';

import * as React from 'react';
import {
	ColumnFiltersState,
	RowData,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
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
import { Columns } from './_component/columns';
import { useMediaQuery } from 'react-responsive';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { cn } from '@/lib/utils';
import { TableToolbar } from '@/components/tables/TableToolbar';import { BookmarksHeader } from '../BookmarksHeader';
import { BookmarkWithMedia } from './_component/types';
import { useInView } from 'react-intersection-observer';
import { Icons } from '@/config/icons';
import { useBookmarkStore } from '@/stores/useBookmarkStore';
import { BookmarkWithMovie, BookmarkWithTvSeries } from '@packages/api-js';

declare module '@tanstack/react-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		displayName: string;
	}
}

interface TableBookmarkProps extends React.HTMLAttributes<HTMLDivElement> {
	data: (
		| ({ type: 'movie' } & BookmarkWithMovie)
		| ({ type: 'tv_series' } & BookmarkWithTvSeries)
	)[];
}

export function TableBookmark({
	data,
	className,
}: TableBookmarkProps) {
	const t = useTranslations();
	const { state, onSortingChange, onColumnVisibilityChange } = useBookmarkStore((state) => state);

	const [rowSelection, setRowSelection] = React.useState({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

	const table = useReactTable<BookmarkWithMedia>({
		data: data,
		columns: Columns(),
		state: {
			rowSelection,
			columnVisibility: state?.columnVisibility,
			columnFilters,
			sorting: state?.sorting,
		},
		enableRowSelection: true,
		enableSortingRemoval: false,
		onRowSelectionChange: setRowSelection,
		onSortingChange: onSortingChange,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: onColumnVisibilityChange,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
		}
	}, [isMobile, table]);

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<TableToolbar table={table} searchPlaceholder={upperFirst(t('common.messages.search_film'))} />
			<div className="rounded-md">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									className="group"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={table.getAllColumns().length}
									className="h-24 text-center"
								>
								{upperFirst(t('common.messages.no_results'))}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
