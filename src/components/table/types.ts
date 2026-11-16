import React from 'react'

export type SortDirection = 'asc' | 'desc'

export interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  accessor?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  className?: string
  cell?: (item: T, index: number) => React.ReactNode
}

export interface FilterOption {
  label: string
  value: string
  count?: number
}

export interface ActiveFilter {
  id: string
  label: string
  value: string
  onRemove: () => void
}

export interface TableFilterConfig {
  id: string
  label: string
  options: FilterOption[]
  selectedValues?: string[]
  selectedValue?: string
  onChange: (value: string | string[]) => void
}

export interface DataTablePaginationConfig {
  currentPage: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}
