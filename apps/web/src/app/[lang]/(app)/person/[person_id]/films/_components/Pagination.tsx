import {
	Pagination as PaginationComponent,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils";
import { useCallback, useMemo } from "react";

export const Pagination = ({
	page,
	perPage,
	total,
	className,
	searchParams,
} : {
	page: number;
	perPage: number;
	total: number;
	className?: string;
	searchParams: URLSearchParams;
}) => {
	const totalPages = useMemo(() => Math.ceil(total / perPage), [total, perPage]);
	
	const pageNumbers = useMemo(() => {
		const pages: (number | string)[] = [];
	
		// Add first page
		if (page > 2) pages.push(1);
		if (page > 3) pages.push("...");
	
		// Add surrounding pages
		for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
		  pages.push(i);
		}
	
		// Add last page
		if (page < totalPages - 2) pages.push("...");
		if (page < totalPages - 1) pages.push(totalPages);
	
		return pages;
	}, [page, totalPages]);

	const generatePageLink = useCallback((pageNumber: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", pageNumber.toString());
		return `?${params.toString()}`;
	}, [searchParams]);
	
	return (
		<PaginationComponent className={cn('', className)}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href={generatePageLink(page - 1)} disabled={page <= 1} />
				</PaginationItem>
				
				{pageNumbers.map((pageNumber, index) =>
					pageNumber === "..." ? (
						<PaginationItem key={`ellipsis-${index}`}>
						<PaginationEllipsis />
						</PaginationItem>
				) : (
						<PaginationItem key={pageNumber}>
						<PaginationLink
						href={generatePageLink(Number(pageNumber))}
						isActive={pageNumber === page}
						>
							{pageNumber}
						</PaginationLink>
						</PaginationItem>
					)
				)}

				<PaginationItem>
					<PaginationNext href={generatePageLink(page + 1)} disabled={page >= totalPages} />
				</PaginationItem>
			</PaginationContent>
		</PaginationComponent>
	);
};