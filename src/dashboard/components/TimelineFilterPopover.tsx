import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import Button from '../../ui/Button'

export type TimelinePreset = '3M' | '6M' | '12M' | 'custom'

export interface TimelineFilter {
  preset: TimelinePreset
  mode?: 'range' | 'single'
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
  singleDate?: string // YYYY-MM-DD
  label: string
}

export const DEFAULT_TIMELINE_FILTER: TimelineFilter = {
  preset: '3M',
  label: '3 Months',
}

interface TimelineFilterPopoverProps {
  value: TimelineFilter
  onChange: (filter: TimelineFilter) => void
}

/**
 * Filter evaluation helper: checks if an ISO date string matches the TimelineFilter.
 */
export function isDateInTimeline(
  isoDateStr: string | undefined,
  filter: TimelineFilter,
  refDate: Date = new Date('2026-11-14T23:59:59Z')
): boolean {
  if (!isoDateStr) return false
  const itemDate = new Date(isoDateStr)
  if (isNaN(itemDate.getTime())) return false

  if (filter.preset === 'custom') {
    if (filter.mode === 'single' && filter.singleDate) {
      const targetStr = filter.singleDate // YYYY-MM-DD
      const itemIso = itemDate.toISOString().slice(0, 10)
      return itemIso === targetStr
    }
    if (filter.mode === 'range') {
      const start = filter.startDate ? new Date(`${filter.startDate}T00:00:00Z`).getTime() : 0
      const end = filter.endDate ? new Date(`${filter.endDate}T23:59:59Z`).getTime() : Infinity
      const t = itemDate.getTime()
      return t >= start && t <= end
    }
  }

  // Preset durations based on reference date
  const now = refDate.getTime()
  const days = filter.preset === '3M' ? 90 : filter.preset === '6M' ? 180 : 365
  const threshold = now - days * 24 * 60 * 60 * 1000
  return itemDate.getTime() >= threshold && itemDate.getTime() <= now
}

export default function TimelineFilterPopover({
  value,
  onChange,
}: TimelineFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customMode, setCustomMode] = useState<'range' | 'single'>('range')
  const [tempStart, setTempStart] = useState('2026-10-01')
  const [tempEnd, setTempEnd] = useState('2026-11-14')
  const [tempSingle, setTempSingle] = useState('2026-11-12')
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectPreset = (preset: '3M' | '6M' | '12M') => {
    const labels: Record<string, string> = {
      '3M': '3 Months',
      '6M': '6 Months',
      '12M': '12 Months',
    }
    onChange({
      preset,
      label: labels[preset],
    })
    setIsOpen(false)
  }

  const handleApplyCustom = () => {
    if (customMode === 'single') {
      onChange({
        preset: 'custom',
        mode: 'single',
        singleDate: tempSingle,
        label: tempSingle,
      })
    } else {
      onChange({
        preset: 'custom',
        mode: 'range',
        startDate: tempStart,
        endDate: tempEnd,
        label: `${tempStart.slice(5)} to ${tempEnd.slice(5)}`,
      })
    }
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* Dropdown Trigger Button */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Filter timeline"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1 text-xs border border-border shadow-sm flex items-center gap-1.5"
      >
        <Calendar className="size-icon-xs text-desc shrink-0" aria-hidden="true" />
        <span className="font-medium text-heading whitespace-nowrap">{value.label}</span>
        <ChevronDown className="size-icon-xs text-desc shrink-0" aria-hidden="true" />
      </Button>

      {/* Popover Dropdown Panel: Clean, normal, non-cluttered */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Select timeline filter"
          className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl p-4 shadow-2xl z-50 space-y-3.5"
        >
          {/* Quick Preset Buttons: Just normal clean buttons without nested track borders */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-heading block">
              Preset Timeline
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['3M', '6M', '12M'] as const).map((p) => {
                const isSelected = value.preset === p
                const labels: Record<string, string> = {
                  '3M': '3 Mos',
                  '6M': '6 Mos',
                  '12M': '12 Mos',
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors text-center outline-none ${
                      isSelected
                        ? 'bg-surface text-heading font-semibold'
                        : 'text-desc hover:text-heading hover:bg-surface/50'
                    }`}
                  >
                    {labels[p]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Date Selection: Simple, clean, clearly visible labels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-heading">Custom Range</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCustomMode('range')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    customMode === 'range'
                      ? 'bg-surface text-heading font-medium'
                      : 'text-desc hover:text-heading'
                  }`}
                >
                  Range
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode('single')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                    customMode === 'single'
                      ? 'bg-surface text-heading font-medium'
                      : 'text-desc hover:text-heading'
                  }`}
                >
                  Single Date
                </button>
              </div>
            </div>

            {customMode === 'range' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1.5">
                    From
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-heading focus:outline-none focus:border-border-focus transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-heading mb-1.5">
                    To
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-heading focus:outline-none focus:border-border-focus transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-heading mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={tempSingle}
                  onChange={(e) => setTempSingle(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-heading focus:outline-none focus:border-border-focus transition-colors"
                />
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApplyCustom}
              className="w-full py-1.5 text-xs rounded-lg mt-1"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
