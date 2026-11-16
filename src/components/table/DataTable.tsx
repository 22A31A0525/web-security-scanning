import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import type { DataTableColumn, SortDirection, DataTablePaginationConfig, TableFilterConfig, ActiveFilter } from './types'
import TableFilterBar from './TableFilterBar'
import DataTablePagination from './DataTablePagination'

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  keyExtractor: (item: T, index: number) => string
  // Max Height Configuration
  maxHeight?: string // e.g. 'max-h-[560px]', 'max-h-[640px]'
  // Sorting Configuration
  sortField?: string | null
  sortDirection?: SortDirection
  onSort?: (field: string) => void
  // Search & Filters Configuration
  searchQuery?: string
  onSearchChange?: (query: string) => void
  searchPlaceholder?: string
  filters?: TableFilterConfig[]
  activeFilters?: ActiveFilter[]
  totalRecords?: number
  recordsLabel?: string
  onResetFilters?: () => void
  headerActions?: React.ReactNode
  // Pagination Configuration
  pagination?: DataTablePaginationConfig
  // Loading & Empty States
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  // Row Interaction
  onRowClick?: (item: T) => void
  className?: string
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  maxHeight = 'max-h-[560px]',
  sortField,
  sortDirection = 'asc',
  onSort,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilters,
  totalRecords,
  recordsLabel,
  onResetFilters,
  headerActions,
  pagination,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search criteria or clear active filters.',
  emptyAction,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const showFilterBar = Boolean(
    onSearchChange || (filters && filters.length > 0) || headerActions
  )

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      {/* 1. Filter & Search Controls Bar - Outside Table Box */}
      {showFilterBar && (
        <TableFilterBar
          searchQuery={searchQuery || ''}
          onSearchChange={onSearchChange || (() => {})}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          activeFilters={activeFilters}
          totalRecords={totalRecords ?? data.length}
          filteredCount={data.length}
          recordsLabel={recordsLabel}
          onResetAll={onResetFilters}
        >
          {headerActions}
        </TableFilterBar>
      )}

      {/* 2. Standalone Table Card Box */}
      <div className="w-full bg-card border border-border rounded-2xl overflow-hidden flex flex-col shadow-xs">
        {/* Scrollable Data Table Container with Controlled Max-Height */}
        <div className={`w-full overflow-x-auto overflow-y-auto ${maxHeight}`}>
          <table className="w-full text-left text-xs border-collapse">
            {/* Sticky Table Header (Proper Case) */}
            <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-xs">
            <tr className="text-desc font-semibold text-xs">
              {columns.map((col) => {
                const isSorted = sortField === col.id
                const isSortable = Boolean(col.sortable && onSort)
                const align = col.align || 'left'
                const alignClass =
                  align === 'right'
                    ? 'text-right'
                    : align === 'center'
                    ? 'text-center'
                    : 'text-left'

                return (
                  <th
                    key={col.id}
                    style={{ width: col.width, minWidth: col.minWidth }}
                    className={`py-2.5 px-3.5 ${alignClass} ${
                      isSortable ? 'cursor-pointer hover:text-heading transition-colors' : ''
                    } ${col.className || ''}`}
                    onClick={() => isSortable && onSort && onSort(col.id)}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
                        align === 'right'
                          ? 'justify-end'
                          : align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span className="whitespace-nowrap">{col.header}</span>
                      {isSortable && (
                        <span className="shrink-0 text-desc">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="size-icon-xs text-heading" />
                            ) : (
                              <ArrowDown className="size-icon-xs text-heading" />
                            )
                          ) : (
                            <ArrowUpDown className="size-icon-xs opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body Rows */}
          <tbody className="divide-y divide-border/40">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-desc">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-desc border-t-heading rounded-full animate-spin" />
                    <span className="text-xs">Loading records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto px-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-desc mb-3">
                      <Inbox className="size-icon-md" />
                    </div>
                    <span className="text-sm font-semibold text-heading mb-1">
                      {emptyTitle}
                    </span>
                    <p className="text-xs text-desc mb-4 text-center">
                      {emptyDescription}
                    </p>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const rowKey = keyExtractor(item, index)

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-surface transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col) => {
                      const align = col.align || 'left'
                      const alignClass =
                        align === 'right'
                          ? 'text-right'
                          : align === 'center'
                          ? 'text-center'
                          : 'text-left'

                      const content = col.cell
                        ? col.cell(item, index)
                        : col.accessor
                        ? col.accessor(item)
                        : (item as Record<string, unknown>)[col.id] as React.ReactNode

                      return (
                        <td
                          key={col.id}
                          style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.width }}
                          className={`py-2.5 px-3.5 text-xs text-body ${alignClass} ${
                            col.className || ''
                          }`}
                        >
                          <div
                            className={`flex items-center min-w-0 ${
                              align === 'right'
                                ? 'justify-end'
                                : align === 'center'
                                ? 'justify-center'
                                : 'justify-start'
                            }`}
                          >
                            {content}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

        {/* 3. Bottom Pagination Bar */}
        {pagination && (
          <DataTablePagination
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
            pageSizeOptions={pagination.pageSizeOptions}
          />
        )}
      </div>
    </div>
  )
}
