import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Target, Activity, ShieldAlert, SlidersHorizontal, ArrowUpRight } from 'lucide-react'
import { useEnrichedFindings, useEnrichedScans, useEnrichedTargets } from '../store/useAppStore'

export interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

type SearchCategory = 'all' | 'targets' | 'scans' | 'findings'

interface SearchResultItem {
  type: 'target' | 'scan' | 'finding'
  id: string
  name: string
  url?: string
  priority?: string
  priorityColor?: string
  route: string
}

// Proper case helper (e.g., 'critical' -> 'Critical', 'owasp_top10' -> 'OWASP Top 10')
function toProperCase(str: string): string {
  if (!str) return ''
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate()
  const modalInputRef = useRef<HTMLInputElement>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const targets = useEnrichedTargets()
  const scans = useEnrichedScans()
  const findings = useEnrichedFindings()

  // Filtered Results Calculation
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const results: SearchResultItem[] = []

    // 1. Targets
    if (activeCategory === 'all' || activeCategory === 'targets') {
      targets.forEach((t) => {
        const match =
          !q ||
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.url.toLowerCase().includes(q) ||
          t.environment.toLowerCase().includes(q)

        if (match) {
          results.push({
            type: 'target',
            id: t.id,
            name: t.name,
            url: t.url,
            priority: toProperCase(t.environment),
            priorityColor:
              t.environment === 'production'
                ? 'text-status-red'
                : t.environment === 'staging'
                  ? 'text-status-yellow'
                  : 'text-status-blue',
            route: `/targets?targetId=${t.id}`,
          })
        }
      })
    }

    // 2. Scans
    if (activeCategory === 'all' || activeCategory === 'scans') {
      scans.forEach((s) => {
        const match =
          !q ||
          s.id.toLowerCase().includes(q) ||
          s.targetName.toLowerCase().includes(q) ||
          (s.profile || '').toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q)

        if (match) {
          results.push({
            type: 'scan',
            id: s.id,
            name: `${toProperCase(s.profile || '')} • ${s.targetName}`,
            priority: toProperCase(s.status),
            priorityColor:
              s.status === 'completed'
                ? 'text-status-green'
                : s.status === 'running'
                  ? 'text-status-blue'
                  : s.status === 'failed'
                    ? 'text-status-red'
                    : 'text-desc',
            route: `/scans?scanId=${s.id}`,
          })
        }
      })
    }

    // 3. Findings
    if (activeCategory === 'all' || activeCategory === 'findings') {
      findings.forEach((f) => {
        const match =
          !q ||
          f.id.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q) ||
          f.targetName.toLowerCase().includes(q) ||
          (f.targetUrl && f.targetUrl.toLowerCase().includes(q)) ||
          f.severity.toLowerCase().includes(q) ||
          f.cwe.toLowerCase().includes(q)

        if (match) {
          results.push({
            type: 'finding',
            id: f.id,
            name: f.title,
            url: f.targetUrl || f.location,
            priority: toProperCase(f.severity),
            priorityColor:
              f.severity === 'critical'
                ? 'text-status-red'
                : f.severity === 'high'
                  ? 'text-status-orange'
                  : f.severity === 'medium'
                    ? 'text-status-yellow'
                    : 'text-status-blue',
            route: `/findings?findingId=${f.id}`,
          })
        }
      })
    }

    return results
  }, [searchQuery, activeCategory, targets, scans, findings])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredResults.length, activeCategory])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus()
      }, 50)
    } else {
      setSearchQuery('')
      setActiveCategory('all')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return
    const container = resultsContainerRef.current
    const activeItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  const totalCount = targets.length + scans.length + findings.length

  const categories = [
    { id: 'all' as const, label: 'All', count: totalCount, icon: SlidersHorizontal },
    { id: 'targets' as const, label: 'Targets', count: targets.length, icon: Target },
    { id: 'scans' as const, label: 'Scans', count: scans.length, icon: Activity },
    { id: 'findings' as const, label: 'Findings', count: findings.length, icon: ShieldAlert },
  ]

  const handleSelectResult = (item: SearchResultItem) => {
    navigate(item.route)
    onClose()
  }

  // Keyboard navigation handler for Arrow keys, Enter, and Tab
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredResults.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex])
      }
    } else if (e.key === 'Tab') {
      // Allow switching between subsections on Tab
      e.preventDefault()
      const catOrder: SearchCategory[] = ['all', 'targets', 'scans', 'findings']
      const curIdx = catOrder.indexOf(activeCategory)
      const nextIdx = e.shiftKey
        ? (curIdx - 1 + catOrder.length) % catOrder.length
        : (curIdx + 1) % catOrder.length
      setActiveCategory(catOrder[nextIdx])
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-canvas/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl min-h-[160px] max-h-[460px] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Header */}
        <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
          <Search className="size-5 text-desc shrink-0" aria-hidden="true" />
          <input
            ref={modalInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, URL, or severity..."
            className="w-full bg-transparent text-heading placeholder:text-placeholder focus:outline-none text-base font-normal"
            aria-label="Search"
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-caption bg-surface border border-border rounded">
              Esc
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-desc hover:text-heading hover:bg-surface transition-colors cursor-pointer"
              aria-label="Close search"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Subsection Filter Pills */}
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = activeCategory === cat.id

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-surface border-heading text-heading'
                    : 'bg-card border-border text-desc hover:text-heading hover:bg-surface'
                }`}
              >
                <Icon className={`size-3.5 shrink-0 ${isSelected ? 'text-heading' : 'text-desc'}`} />
                <span>{cat.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                    isSelected
                      ? 'bg-card text-heading border border-border'
                      : 'bg-surface text-caption'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filtered Results List - Plain minimal text rows with Keyboard Focus */}
        <div
          ref={resultsContainerRef}
          role="listbox"
          className="p-2 overflow-y-auto flex-1 divide-y divide-border/60"
        >
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-desc">
              No matching records found.
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isFocused = idx === selectedIndex

              return (
                <button
                  key={`${item.type}-${item.id}`}
                  data-index={idx}
                  role="option"
                  aria-selected={isFocused}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer group ${
                    isFocused ? 'bg-surface text-heading' : 'text-desc hover:bg-surface/60'
                  }`}
                >
                  {/* Left: ID, Name, and URL without heavy cards */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono text-xs text-status-blue font-semibold shrink-0 group-hover:underline">
                      #{item.id}
                    </span>
                    <span
                      className={`text-xs font-medium truncate max-w-sm ${isFocused ? 'text-heading' : 'text-body'}`}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    {item.url && (
                      <span
                        className="text-[11px] font-mono text-desc truncate max-w-xs shrink-0"
                        title={item.url}
                      >
                        {item.url}
                      </span>
                    )}
                  </div>

                  {/* Right: Proper case Priority/Severity Text & Action Arrow */}
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    {item.priority && (
                      <span
                        className={`text-xs font-medium ${item.priorityColor || 'text-desc'}`}
                      >
                        {item.priority}
                      </span>
                    )}
                    <ArrowUpRight
                      className={`size-icon-xs text-caption transition-opacity ${
                        isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Minimal Footer: Keyboard Navigation Hints */}
        <div className="px-4 py-2 border-t border-border bg-surface/30 flex items-center justify-between text-[11px] text-caption shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-card border border-border rounded font-mono">↑</kbd>
              <kbd className="px-1 py-0.2 bg-card border border-border rounded font-mono">↓</kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-card border border-border rounded font-mono">↵</kbd> to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-card border border-border rounded font-mono">Tab</kbd> to switch sections
            </span>
          </div>
          <span>
            {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  )
}
