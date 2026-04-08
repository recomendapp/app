'use client';
'use no memo';

import * as React from 'react';
import {
	ColumnFiltersState,
	RowData,
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
import { TableToolbar } from '@/components/tables/TableToolbar';
import { RecoWithMedia } from './_component/types';
import { useMyRecosStore } from '@/stores/useMyRecosStore';
import { RecoWithMovie, RecoWithTvSeries } from '@libs/api-js';

declare module '@tanstack/react-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		displayName: string;
	}
}

interface TableMyRecosProps extends React.HTMLAttributes<HTMLDivElement> {
	data: (
		| ({ type: 'movie' } & RecoWithMovie)
		| ({ type: 'tv_series' } & RecoWithTvSeries)
	)[];
}

export function TableMyRecos({
	data,
	className,
}: TableMyRecosProps) {
	const t = useTranslations();
	const { state, onSortingChange, onColumnVisibilityChange } = useMyRecosStore((state) => state);

	const [rowSelection, setRowSelection] = React.useState({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

	const table = useReactTable<RecoWithMedia>({
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
			<TableToolbar table={table} searchPlaceholder={upperFirst(t('common.messages.search_film'))} className='px-4' />
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
									className="h-24 text-center text-muted-foreground"
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
