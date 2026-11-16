import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../ui/Button'
import type { DataTablePaginationConfig } from './types'

export default function DataTablePagination({
  currentPage,
  pageSize = 10,
  totalItems,
  onPageChange,
}: DataTablePaginationConfig) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
  const displayCurrentPage = totalItems === 0 ? 0 : currentPage
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(totalItems, currentPage * pageSize)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 px-5 py-3 border-t border-border bg-card text-xs">
      {/* Left: Telemetry */}
      <div className="text-desc text-left">
        Showing <span className="font-semibold font-mono text-heading">{startItem}</span>–
        <span className="font-semibold font-mono text-heading">{endItem}</span> of{' '}
        <span className="font-semibold font-mono text-heading">{totalItems}</span>
      </div>

      {/* Center: Page Moving Support */}
      <div className="flex items-center justify-center gap-3 text-desc">
        <span>
          Page <span className="font-mono font-semibold text-heading">{displayCurrentPage}</span> of{' '}
          <span className="font-mono font-semibold text-heading">{totalPages}</span>
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || totalPages === 0}
            aria-label="Previous page"
            className="p-1.5 border border-border"
          >
            <ChevronLeft className="size-icon-xs" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            aria-label="Next page"
            className="p-1.5 border border-border"
          >
            <ChevronRight className="size-icon-xs" />
          </Button>
        </div>
      </div>

      {/* Right: Empty for alignment */}
      <div className="hidden sm:block" />
    </div>
  )
}
