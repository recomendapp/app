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

export const Pagination = ({
	page,
	perPage,
	total,
	searchParams,
	className,
} : {
	page: number;
	perPage: number;
	total: number;
	searchParams: URLSearchParams;
	className?: string;
}) => {
	const totalPages = Math.ceil(total / perPage);

	const getPageNumbers = () => {
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
	};
	
	const pageNumbers = getPageNumbers();

	const generatePageLink = (pageNumber: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", pageNumber.toString());
		return `?${params.toString()}`;
	};

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
					<PaginationNext href={generatePageLink(page + 1)} disabled={page >=totalPages} />
				</PaginationItem>
			</PaginationContent>
		</PaginationComponent>
	);
};