import { useMemo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Activity, X, Info } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { isDateInTimeline } from './TimelineFilterPopover'
import type { Finding } from '../../types/schema'

export default function FindingsOverTimeChart() {
  const navigate = useNavigate()
  const findings = useAppStore((state) => state.findings)
  const targets = useAppStore((state) => state.targets)
  const dashboardTimeline = useAppStore((state) => state.dashboardTimeline)

  const [selectedPoint, setSelectedPoint] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'discovered' | 'resolved'>('discovered')
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartWrapperRef = useRef<HTMLDivElement>(null)

  const targetMap = useMemo(() => {
    const map = new Map<string, { name: string; url: string }>()
    targets.forEach((t) => map.set(t.id, { name: t.name, url: t.url }))
    return map
  }, [targets])

  // Build daily timeline points from scoped findings
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { discovered: number; resolved: number }>()

    if (dashboardTimeline.preset === 'today') {
      const baseDate = new Date(dashboardTimeline.singleDate || '2026-11-14')
      for (let i = 6; i >= 0; i--) {
        const d = new Date(baseDate)
        d.setDate(baseDate.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dateMap.set(key, { discovered: 0, resolved: 0 })
      }
    } else {
      const dates = findings.map((f) => f.discoveredAt.slice(0, 10))
      const uniqueSorted = Array.from(new Set(dates)).sort()
      uniqueSorted.forEach((d) => {
        if (isDateInTimeline(d + 'T12:00:00Z', dashboardTimeline)) {
          dateMap.set(d, { discovered: 0, resolved: 0 })
        }
      })

      if (dateMap.size <= 1) {
        const base = new Date('2026-11-14')
        for (let i = 6; i >= 0; i--) {
          const d = new Date(base)
          d.setDate(base.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          dateMap.set(key, { discovered: 0, resolved: 0 })
        }
      }
    }

    findings.forEach((f) => {
      const dateKey = f.discoveredAt.slice(0, 10)
      if (dateMap.has(dateKey)) {
        const entry = dateMap.get(dateKey)!
        entry.discovered += 1
        if (f.status === 'resolved') {
          entry.resolved += 1
        }
      }
    })

    return Array.from(dateMap.entries()).map(([dateStr, counts]) => {
      const d = new Date(dateStr + 'T00:00:00Z')
      const formattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
      return {
        rawDate: dateStr,
        date: formattedDate,
        discovered: counts.discovered,
        resolved: counts.resolved,
      }
    })
  }, [findings, dashboardTimeline])

  const totalDiscovered = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.discovered, 0)
  }, [chartData])

  const totalResolved = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.resolved, 0)
  }, [chartData])

  // Active findings for selected point and selected tab (Discovered vs Resolved)
  const tabFindings = useMemo(() => {
    if (!selectedPoint) return []
    return findings.filter((f) => {
      const matchDate = f.discoveredAt.startsWith(selectedPoint.rawDate)
      if (!matchDate) return false
      if (activeTab === 'resolved') return f.status === 'resolved'
      return f.status !== 'resolved'
    })
  }, [findings, selectedPoint, activeTab])

  // Close popup when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedPoint(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPoint(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Floating outside placement calculation matching SeverityTrendChart exactly
  const popoverStyles = useMemo(() => {
    const containerWidth = chartWrapperRef.current?.clientWidth || 340
    const clickX = clickCoords?.x ?? containerWidth / 2
    const clickY = clickCoords?.y ?? 80

    // Width matching SeverityTrendChart (380px or responsive)
    const popoverWidth = 360
    let left = clickX - popoverWidth / 2
    if (clickX < 140) left = 4
    else if (clickX > containerWidth - 140) left = containerWidth - popoverWidth - 4

    const top = Math.max(-25, clickY - 140)

    return {
      left: `${left}px`,
      top: `${top}px`,
    }
  }, [clickCoords])

  return (
    <section
      ref={containerRef}
      aria-label="Findings Over Time"
      className={`col-span-1 h-[320px] max-h-[320px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between relative transition-all duration-150 ${
        selectedPoint ? 'z-50' : 'z-10'
      }`}
    >
      {/* Header: Title and Description */}
      <div className="flex items-center justify-between min-h-[32px] gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-bold text-heading whitespace-nowrap">
            Findings over time
          </span>
          <span className="text-xs text-desc truncate">
            {totalResolved} resolved of {totalDiscovered} discovered ({dashboardTimeline.label})
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div ref={chartWrapperRef} className="relative w-full h-48 sm:h-52 my-1">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-surface/20 border border-border/50">
            <Activity className="size-8 text-desc/40 mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-heading">
              No findings recorded in this timeframe
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length) {
                  const payload = e.activePayload[0].payload
                  setSelectedPoint((prev: any) => (prev?.rawDate === payload.rawDate ? null : payload))
                  if (e.chartX !== undefined && e.chartY !== undefined) {
                    setClickCoords({ x: e.chartX, y: e.chartY })
                  }
                }
              }}
              className="cursor-pointer"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#21262d' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: '#21262d', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={() => null}
              />
              <Area
                type="monotone"
                dataKey="discovered"
                name="Discovered"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="none"
                activeDot={{
                  r: 4.5,
                  stroke: '#000000',
                  strokeWidth: 2,
                  fill: '#3b82f6',
                  cursor: 'pointer',
                  onClick: (_e: any, eventPayload: any) => {
                    if (eventPayload?.payload) {
                      setActiveTab('discovered')
                      setSelectedPoint((prev: any) =>
                        prev?.rawDate === eventPayload.payload.rawDate && activeTab === 'discovered'
                          ? null
                          : eventPayload.payload
                      )
                      if (eventPayload.cx !== undefined && eventPayload.cy !== undefined) {
                        setClickCoords({ x: eventPayload.cx, y: eventPayload.cy })
                      }
                    }
                  },
                }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#60a5fa"
                strokeDasharray="4 4"
                strokeWidth={2}
                fill="none"
                activeDot={{
                  r: 4.5,
                  stroke: '#000000',
                  strokeWidth: 2,
                  fill: '#60a5fa',
                  cursor: 'pointer',
                  onClick: (_e: any, eventPayload: any) => {
                    if (eventPayload?.payload) {
                      setActiveTab('resolved')
                      setSelectedPoint((prev: any) =>
                        prev?.rawDate === eventPayload.payload.rawDate && activeTab === 'resolved'
                          ? null
                          : eventPayload.payload
                      )
                      if (eventPayload.cx !== undefined && eventPayload.cy !== undefined) {
                        setClickCoords({ x: eventPayload.cx, y: eventPayload.cy })
                      }
                    }
                  },
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Clean, Non-Cluttered Popover matching the exact visual format in Screenshot 2 */}
        {selectedPoint && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={popoverStyles}
            className="absolute z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header: Clean Tabs (Discovered & Resolved with counts) + Top-right X mark exactly like Screenshot 2 */}
            <div className="px-3.5 py-2 min-h-[42px] flex items-center justify-between gap-2 bg-transparent border-b border-border">
              <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('discovered')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 ${
                    activeTab === 'discovered'
                      ? 'text-status-blue bg-surface'
                      : 'text-desc hover:text-heading hover:bg-surface/50'
                  }`}
                >
                  <span>Discovered</span>
                  <span className="text-[10px] opacity-80">({selectedPoint.discovered})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('resolved')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 ${
                    activeTab === 'resolved'
                      ? 'text-status-green bg-surface'
                      : 'text-desc hover:text-heading hover:bg-surface/50'
                  }`}
                >
                  <span>Resolved</span>
                  <span className="text-[10px] opacity-80">({selectedPoint.resolved})</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedPoint(null)}
                  title="Close popover"
                  aria-label="Close popover"
                  className="p-1 rounded-lg hover:bg-surface text-desc hover:text-heading transition-colors cursor-pointer shrink-0"
                >
                  <X className="size-icon-xs shrink-0" />
                </button>
              </div>
            </div>

            {/* Row-level separated records with internal scroll (identical to Screenshot 2) */}
            <div className="divide-y divide-border max-h-52 overflow-y-auto bg-card">
              {tabFindings.length === 0 ? (
                <div className="px-3.5 py-3 text-xs text-desc text-center">
                  No {activeTab} findings recorded on {selectedPoint.date}
                </div>
              ) : (
                tabFindings.map((finding: Finding) => {
                  const targetInfo = targetMap.get(finding.targetId)
                  const displayUrl = targetInfo?.url || finding.location
                  return (
                    <div
                      key={finding.id}
                      onClick={() => navigate(`/findings?findingId=${finding.id}`)}
                      className="px-3.5 py-2.5 bg-transparent hover:bg-surface transition-colors duration-150 cursor-pointer space-y-0.5"
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
                        <span className="px-1.5 py-0.5 rounded-md bg-surface border border-border text-desc text-[10px] shrink-0 font-medium select-none">
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
      </div>

      {/* Bottom: Clean minimal Legend with Discovered/Resolved & Info Hint */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-desc">
            <span className="w-3.5 h-0.5 bg-status-blue rounded-full shrink-0" aria-hidden="true" />
            <span className="truncate">Discovered ({totalDiscovered})</span>
          </div>
          <div className="flex items-center gap-1.5 text-desc">
            <span
              className="w-3.5 h-0.5 border-b border-dashed border-status-blue/80 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">Resolved ({totalResolved})</span>
          </div>
        </div>

        {/* Bottom Right: Click point to inspect hint */}
        <div className="flex items-center gap-1 text-[11px] text-desc font-medium shrink-0">
          <Info className="size-icon-xs text-desc shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Click point to inspect</span>
        </div>
      </div>
    </section>
  )
}
