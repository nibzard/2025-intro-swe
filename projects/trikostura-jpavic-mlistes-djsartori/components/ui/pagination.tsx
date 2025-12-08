'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5; // Max pages to show

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6">
      {/* First page */}
      <Link href={createPageUrl(1)} aria-disabled={currentPage === 1}>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          className="hidden sm:flex h-9 w-9 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </Link>

      {/* Previous page */}
      <Link href={createPageUrl(Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1}>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          className="h-9 w-9 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </Link>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, idx) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                ...
              </span>
            );
          }

          return (
            <Link key={page} href={createPageUrl(page)}>
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="h-9 w-9 p-0"
              >
                {page}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Next page */}
      <Link href={createPageUrl(Math.min(totalPages, currentPage + 1))} aria-disabled={currentPage === totalPages}>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          className="h-9 w-9 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>

      {/* Last page */}
      <Link href={createPageUrl(totalPages)} aria-disabled={currentPage === totalPages}>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          className="hidden sm:flex h-9 w-9 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
