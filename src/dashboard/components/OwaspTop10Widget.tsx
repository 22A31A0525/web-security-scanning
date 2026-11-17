import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, X, Info, Activity } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../ui/Button'
import type { Finding } from '../../types/schema'
import { isDateInTimeline } from './TimelineFilterPopover'

type SeverityTier = 'critical' | 'high' | 'medium' | 'low'

const tierConfig: Record<
  SeverityTier,
  { label: string; colorClass: string; dotClass: string; shortLabel: string }
> = {
  critical: {
    label: 'Critical',
    colorClass: 'text-status-red',
    dotClass: 'bg-status-red',
    shortLabel: 'Critical',
  },
  high: {
    label: 'High',
    colorClass: 'text-status-orange',
    dotClass: 'bg-status-orange',
    shortLabel: 'High',
  },
  medium: {
    label: 'Medium',
    colorClass: 'text-status-yellow',
    dotClass: 'bg-status-yellow',
    shortLabel: 'Medium',
  },
  low: {
    label: 'Low',
    colorClass: 'text-status-blue',
    dotClass: 'bg-status-blue',
    shortLabel: 'Low',
  },
}

// Short readable label mapping for OWASP Top 10 on the X-axis
const OWASP_SHORT_LABELS: Record<string, string> = {
  'A01: Broken Access Control': 'A01 Access',
  'A02: Cryptographic Failures': 'A02 Crypto',
  'A03: Injection': 'A03 Injection',
  'A04: Insecure Design': 'A04 Design',
  'A05: Security Misconfiguration': 'A05 Misconfig',
  'A06: Vulnerable and Outdated Components': 'A06 Outdated',
  'A07: Identification and Authentication Failures': 'A07 Auth',
  'A08: Software and Data Integrity Failures': 'A08 Integrity',
  'A09: Security Logging and Monitoring Failures': 'A09 Logging',
  'A10: Server-Side Request Forgery (SSRF)': 'A10 SSRF',
}

export default function OwaspTop10Widget() {
  const navigate = useNavigate()
  const findings = useAppStore((state) => state.findings)
  const targets = useAppStore((state) => state.targets)
  const timeline = useAppStore((state) => state.dashboardTimeline)

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeSeverity, setActiveSeverity] = useState<SeverityTier>('critical')
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLElement>(null)
  const chartWrapperRef = useRef<HTMLDivElement>(null)

  // Map targets by ID for fast lookup
  const targetMap = useMemo(() => {
    const map = new Map<string, string>()
    targets.forEach((t) => map.set(t.id, t.url || t.name))
    return map
  }, [targets])

  // Active findings filtered by Timeline Filter
  const activeTimelineFindings = useMemo(() => {
    return findings
      .filter((f) => f.status === 'open' || f.status === 'confirmed')
      .filter((f) => isDateInTimeline(f.discoveredAt, timeline))
  }, [findings, timeline])

  // Compute live OWASP Top 10 categories breakdown strictly based on timeline filter
  const chartData = useMemo(() => {
    const categoryMap = new Map<string, { crit: number; high: number; med: number; low: number }>()

    activeTimelineFindings.forEach((f) => {
      const key = f.category
      const curr = categoryMap.get(key) || { crit: 0, high: 0, med: 0, low: 0 }
      if (f.severity === 'critical') curr.crit++
      else if (f.severity === 'high') curr.high++
      else if (f.severity === 'medium') curr.med++
      else if (f.severity === 'low') curr.low++
      categoryMap.set(key, curr)
    })

    return Array.from(categoryMap.entries())
      .map(([category, counts]) => {
        const code = category.slice(0, 3)
        const shortLabel = OWASP_SHORT_LABELS[category] || code
        return {
          code,
          shortLabel,
          fullName: category,
          critical: counts.crit,
          high: counts.high,
          medium: counts.med,
          low: counts.low,
          total: counts.crit + counts.high + counts.med + counts.low,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [activeTimelineFindings])

  // Active findings for the selected category
  const activeCategoryFindings = useMemo(() => {
    if (!selectedCategory) return []
    return activeTimelineFindings.filter((f) => f.category === selectedCategory)
  }, [activeTimelineFindings, selectedCategory])

  // Findings for the active severity tab inside the popup
  const activeTierFindings = useMemo(() => {
    return activeCategoryFindings.filter((f) => f.severity === activeSeverity)
  }, [activeCategoryFindings, activeSeverity])

  // Severity counts within the selected category
  const categoryTierCounts = useMemo(() => {
    return {
      critical: activeCategoryFindings.filter((f) => f.severity === 'critical').length,
      high: activeCategoryFindings.filter((f) => f.severity === 'high').length,
      medium: activeCategoryFindings.filter((f) => f.severity === 'medium').length,
      low: activeCategoryFindings.filter((f) => f.severity === 'low').length,
    }
  }, [activeCategoryFindings])

  // Overall counts for bottom legend row
  const overallSeverityCounts = useMemo(() => {
    return chartData.reduce(
      (acc, item) => ({
        critical: acc.critical + item.critical,
        high: acc.high + item.high,
        medium: acc.medium + item.medium,
        low: acc.low + item.low,
        total: acc.total + item.total,
      }),
      { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
    )
  }, [chartData])

  // Handle outside click & escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedCategory(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCategory(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Dynamic placement logic matching SeverityTrendChart: popover clamped neatly inside container
  const popoverStyles = useMemo(() => {
    const containerWidth = chartWrapperRef.current?.clientWidth || 500
    const containerHeight = chartWrapperRef.current?.clientHeight || 280
    const popoverWidth = 420
    const popoverHeight = 220
    const clickX = clickCoords?.x ?? containerWidth / 2
    const clickY = clickCoords?.y ?? containerHeight / 2

    let left = clickX > containerWidth / 2 ? clickX - popoverWidth - 14 : clickX + 14
    left = Math.max(8, Math.min(left, containerWidth - popoverWidth - 8))

    let top = clickY - 50
    top = Math.max(8, Math.min(top, containerHeight - popoverHeight - 8))

    return { left, top }
  }, [clickCoords])

  return (
    <section
      ref={containerRef}
      aria-label="OWASP Top 10 Categories"
      className="col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col justify-between relative z-10"
    >
      {/* Top Header Row with Dynamic Subtitle (Synchronized to Global Dashboard Timeline) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-bold text-heading whitespace-nowrap">
            OWASP Top 10 Categories
          </h2>
          <p className="text-xs text-desc">
            Vulnerability distribution across OWASP categories ({timeline.label})
          </p>
        </div>
      </div>

      {/* Chart Area or Clean Zero-Data Empty State matching SeverityTrendChart */}
      <div ref={chartWrapperRef} className="relative w-full h-64 sm:h-72 my-1">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-xl  border border-border/50">
            <Activity className="size-8 text-desc/40 mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-heading">
              No vulnerability data recorded on {timeline.label}
            </p>
            <p className="text-xs text-desc mt-1 max-w-sm">
              0 findings were discovered during this selection. Select a different date or preset timeline.
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 15, left: -10, bottom: 25 }}
            onClick={(e: any) => {
              const clickedFullName =
                e?.activePayload?.[0]?.payload?.fullName ||
                (e?.activeLabel &&
                  chartData.find(
                    (d) => d.shortLabel === e.activeLabel || d.fullName === e.activeLabel
                  )?.fullName)
              if (clickedFullName) {
                const targetItem = chartData.find((d) => d.fullName === clickedFullName)
                if (targetItem) {
                  if (targetItem.critical > 0) setActiveSeverity('critical')
                  else if (targetItem.high > 0) setActiveSeverity('high')
                  else if (targetItem.medium > 0) setActiveSeverity('medium')
                  else setActiveSeverity('low')
                }
                setSelectedCategory((prev) => (prev === clickedFullName ? null : clickedFullName))
                if (e?.chartX !== undefined && e?.chartY !== undefined) {
                  setClickCoords({ x: e.chartX, y: e.chartY })
                }
              }
            }}
            className="cursor-pointer"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#21262d' }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={38}
              dy={4}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 15]}
              ticks={[0, 5, 10, 15]}
              allowDecimals={false}
              label={{
                value: 'Active Vulnerabilities Count',
                angle: -90,
                position: 'insideLeft',
                offset: 14,
                fill: '#71717a',
                fontSize: 10,
                fontWeight: 500,
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              content={() => null}
            />
            <Bar dataKey="critical" stackId="owasp" fill="#f04343" name="Critical" maxBarSize={30}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-crit-${index}`}
                  stroke={selectedCategory === entry.fullName ? '#ffffff' : 'none'}
                  strokeWidth={selectedCategory === entry.fullName ? 2 : 0}
                />
              ))}
            </Bar>
            <Bar dataKey="high" stackId="owasp" fill="#f97316" name="High" maxBarSize={30}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-high-${index}`}
                  stroke={selectedCategory === entry.fullName ? '#ffffff' : 'none'}
                  strokeWidth={selectedCategory === entry.fullName ? 2 : 0}
                />
              ))}
            </Bar>
            <Bar dataKey="medium" stackId="owasp" fill="#eab308" name="Medium" maxBarSize={30}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-med-${index}`}
                  stroke={selectedCategory === entry.fullName ? '#ffffff' : 'none'}
                  strokeWidth={selectedCategory === entry.fullName ? 2 : 0}
                />
              ))}
            </Bar>
            <Bar
              dataKey="low"
              stackId="owasp"
              fill="#3b82f6"
              name="Low"
              radius={[0, 0, 0, 0]}
              maxBarSize={30}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-low-${index}`}
                  stroke={selectedCategory === entry.fullName ? '#ffffff' : 'none'}
                  strokeWidth={selectedCategory === entry.fullName ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

            {/* Refined Popup Anchored on User Click with Severity Tabs + Show All action */}
            {selectedCategory && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute z-50 bg-card border border-border rounded-2xl shadow-2xl w-80 sm:w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                style={popoverStyles}
              >
                {/* Header Row: Interactive severity tabs with counts + Show All Button + Close button */}
                <div className="px-3.5 py-2 min-h-[42px] flex items-center justify-between gap-2 bg-transparent border-b border-border">
                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0 overflow-x-auto">
                    {(['critical', 'high', 'medium', 'low'] as SeverityTier[]).map((tier) => {
                      const count = categoryTierCounts[tier]
                      const isSelected = activeSeverity === tier
                      const config = tierConfig[tier]
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setActiveSeverity(tier)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 ${
                            isSelected
                              ? `${config.colorClass} bg-surface`
                              : 'text-desc hover:text-heading hover:bg-surface/50'
                          }`}
                        >
                          <span>{config.shortLabel}</span>
                          <span className="text-[10px] opacity-80">({count})</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeCategoryFindings.length > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        aria-label="Show all category findings"
                        onClick={() =>
                          navigate(`/findings?category=${encodeURIComponent(selectedCategory)}`)
                        }
                        className="px-2.5 py-1 text-xs border border-border shadow-sm flex items-center gap-1.5"
                      >
                        <span>Show all</span>
                        <ArrowUpRight
                          className="size-icon-xs text-desc shrink-0"
                          aria-hidden="true"
                        />
                      </Button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      title="Close popover"
                      aria-label="Close popover"
                      className="p-1 rounded-lg hover:bg-surface text-desc hover:text-heading transition-colors cursor-pointer shrink-0"
                    >
                      <X className="size-icon-xs shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Row-level separated records with internal scroll (Identical to SeverityTrendChart) */}
                <div className="divide-y divide-border max-h-56 overflow-y-auto">
                  {activeTierFindings.length === 0 ? (
                    <div className="px-3.5 py-2.5 text-xs text-desc">
                      No {activeSeverity} findings recorded in this category
                    </div>
                  ) : (
                    activeTierFindings.map((finding: Finding) => {
                      const target = targetMap.get(finding.targetId)
                      const displayUrl = target || finding.location
                      return (
                        <div
                          key={finding.id}
                          onClick={() => navigate(`/findings?findingId=${finding.id}`)}
                          className="px-3.5 py-2 bg-transparent hover:bg-surface transition-colors duration-150 cursor-pointer space-y-0.5"
                        >
                          {/* Row 1: Finding Title */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-xs font-semibold text-heading truncate flex-1 min-w-0"
                              title={finding.title}
                            >
                              {finding.title}
                            </span>
                          </div>
                          {/* Row 2: Target URL & Scan ID badge */}
                          <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                            <span
                              className="text-desc truncate flex-1 min-w-0"
                              title={displayUrl}
                            >
                              {displayUrl}
                            </span>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-surface border border-border text-desc shrink-0 select-none">
                              #{finding.scanId}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Row: Exact matching structure with SeverityTrendChart (Severity counts + Right Info Hint) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 mt-1">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-desc whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-red" aria-hidden="true" />
            <span>Critical ({overallSeverityCounts.critical})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-orange" aria-hidden="true" />
            <span>High ({overallSeverityCounts.high})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-yellow" aria-hidden="true" />
            <span>Medium ({overallSeverityCounts.medium})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-blue" aria-hidden="true" />
            <span>Low ({overallSeverityCounts.low})</span>
          </div>
        </div>

        {/* Bottom Right: Click to inspect hint */}
        <div className="flex items-center gap-1.5 text-xs text-desc font-medium shrink-0 self-start sm:self-auto">
          <Info className="size-icon-xs text-desc shrink-0" aria-hidden="true" />
          <span>Click any bar to inspect findings</span>
        </div>
      </div>
    </section>
  )
}
