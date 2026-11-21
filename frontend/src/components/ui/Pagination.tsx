import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Build a compact page list with ellipses, e.g. 1 … 4 5 6 … 12 */
function buildPages(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) result.push('…');
    result.push(page);
    previous = page;
  }
  return result;
}

export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-between gap-4', className)}
      aria-label="Pagination"
    >
      <p className="text-sm text-subtle">
        Showing <span className="font-medium text-ink">{from}</span>–
        <span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Prev
        </Button>
        <div className="hidden items-center gap-1 sm:flex">
          {buildPages(page, totalPages).map((item, index) =>
            item === '…' ? (
              <span key={`gap-${index}`} className="px-2 text-sm text-subtle">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={cn(
                  'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors',
                  item === page
                    ? 'bg-brand-600 text-white'
                    : 'text-subtle hover:bg-elevated hover:text-ink',
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export default Pagination;
