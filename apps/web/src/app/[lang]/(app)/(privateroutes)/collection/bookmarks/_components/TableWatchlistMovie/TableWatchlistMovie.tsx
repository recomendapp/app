'use client';
import * as React from 'react';
import {
	ColumnFiltersState,
	RowData,
	SortingState,
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
import { Columns } from './_component/columns';
import { useMediaQuery } from 'react-responsive';
import { UserWatchlistMovie } from '@recomendapp/types';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { cn } from '@/lib/utils';
import { TableToolbar } from '@/components/tables/TableToolbar';

declare module '@tanstack/react-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		displayName: string;
	}
}

interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
	data: UserWatchlistMovie[];
}

export function TableWatchlistMovie({ data,className, ...props }: DataTableProps) {
	const t = useTranslations();
	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const table = useReactTable<UserWatchlistMovie>({
		data,
		columns: Columns(),
		initialState: {
			pagination: {
				pageSize: 5000,
			},
		},
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
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

	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
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
