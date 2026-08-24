'use client';

import { useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';

export function ImporterJobsPagination({
  page,
  perPage,
  total,
  onPageChange,
}: {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];

    if (page > 2) pages.push(1);
    if (page > 3) pages.push('...');

    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push('...');
    if (page < totalPages - 1) pages.push(totalPages);

    return pages;
  }, [page, totalPages]);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="ghost"
            size="default"
            className="gap-1 px-2.5 sm:pl-2.5"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon size={16} />
            <span className="hidden sm:block">Previous</span>
          </Button>
        </PaginationItem>

        {pageNumbers.map((pageNumber, index) =>
          pageNumber === '...' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={pageNumber}>
              <Button
                variant={pageNumber === page ? 'outline' : 'ghost'}
                size="icon"
                onClick={() => onPageChange(Number(pageNumber))}
              >
                {pageNumber}
              </Button>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <Button
            variant="ghost"
            size="default"
            className="gap-1 px-2.5 sm:pr-2.5"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRightIcon size={16} />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
