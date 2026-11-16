import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X, SlidersHorizontal, RotateCcw } from 'lucide-react'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import type { TableFilterConfig, ActiveFilter } from './types'

export interface TableFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  filters?: TableFilterConfig[]
  activeFilters?: ActiveFilter[]
  totalRecords?: number
  filteredCount?: number
  recordsLabel?: string
  onResetAll?: () => void
  children?: React.ReactNode
}

export default function TableFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  activeFilters = [],
  totalRecords: _totalRecords,
  filteredCount: _filteredCount,
  recordsLabel: _recordsLabel = 'records',
  onResetAll,
  children,
}: TableFilterBarProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getFilterValues = (f: TableFilterConfig): string[] => {
    if (f.selectedValues) return f.selectedValues
    if (f.selectedValue) return [f.selectedValue]
    return ['all']
  }

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    activeFilters.length > 0 ||
    filters.some((f) => {
      const vals = getFilterValues(f)
      return vals.length > 0 && !vals.includes('all')
    })

  return (
    <div
      ref={barRef}
      className="w-full flex flex-col gap-3"
    >
      {/* Top Filter Controls: Search Box + Multiple Filter Dropdowns + Custom Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search Box - Using Project's Exact Input Geometry and Styling */}
          <div className="w-full sm:w-80 md:w-96 relative">
            <Input
              variant="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              rightElement={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="p-1 rounded-md text-desc hover:text-heading hover:bg-surface transition-colors cursor-pointer"
                  >
                    <X className="size-icon-xs" aria-hidden="true" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Multiple Filter Dropdown Selectors */}
          {filters.map((filter) => {
            const isOpen = openDropdownId === filter.id
            const currentValues = getFilterValues(filter)
            const isAll = currentValues.length === 0 || currentValues.includes('all')
            const isFiltered = !isAll

            let displayLabel = 'All'
            if (!isAll) {
              if (currentValues.length === 1) {
                const opt = filter.options.find((o) => o.value === currentValues[0])
                displayLabel = opt?.label || currentValues[0]
              } else {
                displayLabel = `${currentValues.length} selected`
              }
            }

            return (
              <div key={filter.id} className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  selected={isFiltered}
                  onClick={() => setOpenDropdownId(isOpen ? null : filter.id)}
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  className="px-3.5 py-2 border border-border text-xs gap-2"
                >
                  <SlidersHorizontal className="size-icon-xs text-desc shrink-0" aria-hidden="true" />
                  <span className="text-desc font-normal">{filter.label}:</span>
                  <span className="text-heading font-semibold truncate max-w-[120px]">
                    {displayLabel}
                  </span>
                  <ChevronDown
                    className={`size-icon-xs text-desc transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </Button>

                {isOpen && (
                  <div
                    role="listbox"
                    aria-label={filter.label}
                    className="absolute top-full left-0 mt-2 z-50 w-52 bg-sidebar border border-border rounded-xl p-1.5 shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {filter.options.map((opt) => {
                      const isOptionAll = opt.value === 'all'
                      const isSelected = isOptionAll
                        ? isAll
                        : !isAll && currentValues.includes(opt.value)

                      const handleOptionClick = () => {
                        if (isOptionAll) {
                          filter.onChange(['all'])
                        } else {
                          let next: string[]
                          if (currentValues.includes(opt.value)) {
                            next = currentValues.filter((v) => v !== opt.value && v !== 'all')
                            if (next.length === 0) next = ['all']
                          } else {
                            next = [...currentValues.filter((v) => v !== 'all'), opt.value]
                          }
                          filter.onChange(next)
                        }
                      }

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={handleOptionClick}
                          className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg cursor-pointer transition-colors hover:bg-surface text-desc hover:text-heading"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Checkbox Indicator for clear multi-select feedback */}
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? 'bg-heading text-canvas border border-heading'
                                  : 'border border-border-input bg-canvas'
                              }`}
                            >
                              {isSelected && <Check className="size-3 stroke-[3]" />}
                            </div>

                            <span className={`truncate ${isSelected ? 'text-heading font-medium' : 'text-desc'}`}>
                              {opt.label}
                            </span>
                          </div>

                          {opt.count !== undefined && (
                            <span className="text-xs text-desc font-mono ml-2 shrink-0">
                              ({opt.count})
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right side: Custom Actions (top-right duplicate counter removed) */}
        {children && (
          <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
            {children}
          </div>
        )}
      </div>

      {/* Active Filter Badges Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-xs">
          <span className="text-caption font-medium">Active filters:</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-heading text-xs">
              <span className="text-desc">Search:</span>
              <span className="font-medium">"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-desc hover:text-heading cursor-pointer ml-0.5"
                aria-label="Remove search filter"
              >
                <X className="size-icon-xs" />
              </button>
            </span>
          )}

          {filters.map((f) => {
            const vals = getFilterValues(f)
            if (vals.includes('all') || vals.length === 0) return null

            return vals.map((val) => {
              const opt = f.options.find((o) => o.value === val)
              return (
                <span
                  key={`${f.id}-${val}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-heading text-xs"
                >
                  <span className="text-desc">{f.label}:</span>
                  <span className="font-medium">{opt?.label || val}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = vals.filter((v) => v !== val)
                      f.onChange(next.length === 0 ? ['all'] : next)
                    }}
                    className="text-desc hover:text-heading cursor-pointer ml-0.5"
                    aria-label={`Remove ${opt?.label || val} filter`}
                  >
                    <X className="size-icon-xs" />
                  </button>
                </span>
              )
            })
          })}

          {activeFilters.map((af) => (
            <span
              key={af.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-heading text-xs"
            >
              <span className="text-desc">{af.label}:</span>
              <span className="font-medium">{af.value}</span>
              <button
                type="button"
                onClick={af.onRemove}
                className="text-desc hover:text-heading cursor-pointer ml-0.5"
                aria-label={`Remove ${af.label} filter`}
              >
                <X className="size-icon-xs" />
              </button>
            </span>
          ))}

          {onResetAll && (
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex items-center gap-1 text-xs text-desc hover:text-heading transition-colors ml-2 cursor-pointer"
            >
              <RotateCcw className="size-icon-xs" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
