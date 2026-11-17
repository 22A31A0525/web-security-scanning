import { useState, useMemo, useRef } from 'react'
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
import { useDashboardAnalytics, useAppStore } from '../../store/useAppStore'
import type { SeverityTrendPoint, Finding } from '../../types/schema'
import TimelineFilterPopover, {
  DEFAULT_TIMELINE_FILTER,
  TimelineFilter,
  isDateInTimeline,
} from './TimelineFilterPopover'
// @ts-ignore
import tailwindConfig from '../../../tailwind.config.js'

const colors = tailwindConfig.theme.extend.colors

export type SeverityTier = 'critical' | 'high' | 'medium' | 'low'

const tierConfig: Record<
  SeverityTier,
  { label: string; colorClass: string; dotClass: string; shortLabel: string }
> = {
  critical: {
    label: 'Critical Ones',
    colorClass: 'text-status-red',
    dotClass: 'bg-status-red',
    shortLabel: 'Critical',
  },
  high: {
    label: 'High Ones',
    colorClass: 'text-status-orange',
    dotClass: 'bg-status-orange',
    shortLabel: 'High',
  },
  medium: {
    label: 'Medium Ones',
    colorClass: 'text-status-yellow',
    dotClass: 'bg-status-yellow',
    shortLabel: 'Medium',
  },
  low: {
    label: 'Low Ones',
    colorClass: 'text-status-blue',
    dotClass: 'bg-status-blue',
    shortLabel: 'Low',
  },
}

interface ScanReportTooltipProps {
  selectedPoint: any
  timelineFindings: Finding[]
  activeSeverity: SeverityTier
  onSeverityChange: (tier: SeverityTier) => void
  onClose: () => void
}

function ScanReportTooltip({
  selectedPoint,
  timelineFindings,
  activeSeverity,
  onSeverityChange,
  onClose,
}: ScanReportTooltipProps) {
  const navigate = useNavigate()
  const targets = useAppStore((state) => state.targets)
  const targetMap = useMemo(() => new Map(targets.map((t) => [t.id, t])), [targets])

  const point = selectedPoint

  // Filter actual findings for the selected severity tier up to this point in time
  const tierFindings = useMemo(() => {
    if (!point) return []
    return timelineFindings.filter((f) => {
      if (f.severity !== activeSeverity) return false
      if (point.isoDate) {
        return f.discoveredAt.slice(0, 10) <= point.isoDate
      }
      return true
    })
  }, [point, activeSeverity, timelineFindings])

  if (!point) return null

  const pointFindingsCount = (tier: SeverityTier) => {
    return timelineFindings.filter((f) => {
      if (f.severity !== tier) return false
      if (point.isoDate) {
        return f.discoveredAt.slice(0, 10) <= point.isoDate
      }
      return true
    }).length
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-card border border-border rounded-2xl shadow-2xl w-96 sm:w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden"
    >
      {/* Header Row: Interactive severity tabs with counts + Close button */}
      <div className="px-3.5 py-2 min-h-[42px] flex items-center justify-between gap-2 bg-transparent border-b border-border">
        <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
          {(['critical', 'high', 'medium', 'low'] as SeverityTier[]).map((tier) => {
            const count = pointFindingsCount(tier)
            const isSelected = activeSeverity === tier
            const config = tierConfig[tier]
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onSeverityChange(tier)}
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
          <button
            type="button"
            onClick={onClose}
            title="Close popover"
            aria-label="Close popover"
            className="p-1 rounded-lg hover:bg-surface text-desc hover:text-heading transition-colors cursor-pointer shrink-0"
          >
            <X className="size-icon-xs shrink-0" />
          </button>
        </div>
      </div>

      {/* Row-level separated records with internal scroll */}
      <div className="border-t border-border divide-y divide-border max-h-56 overflow-y-auto">
        {tierFindings.length === 0 ? (
          <div className="px-3.5 py-2.5 text-xs text-desc">
            No {activeSeverity} findings recorded at this point
          </div>
        ) : (
          tierFindings.map((finding) => {
            const target = targetMap.get(finding.targetId)
            const displayUrl = target?.url || finding.location
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
                {/* Row 2: Target URL & Scan ID only */}
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
  )
}

export default function SeverityTrendChart() {
  const [timeline, setTimeline] = useState<TimelineFilter>(DEFAULT_TIMELINE_FILTER)
  const findings = useAppStore((state) => state.findings)
  const { severityStats: liveStats } = useDashboardAnalytics()

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [activeSeverity, setActiveSeverity] = useState<SeverityTier>('critical')
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null)
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number } | null>(null)

  // 1. Filter findings that fall strictly within the active timeline and are active (open / confirmed)
  const activeTimelineFindings = useMemo(() => {
    return findings
      .filter((f) => f.status === 'open' || f.status === 'confirmed')
      .filter((f) => isDateInTimeline(f.discoveredAt, timeline))
  }, [findings, timeline])

  const criticalFindings = useMemo(() => {
    return activeTimelineFindings.filter((f) => f.severity === 'critical')
  }, [activeTimelineFindings])

  // 2. Truthful severity counts for the selected timeline
  const timelineStats = useMemo(() => {
    if (timeline.preset === 'custom') {
      return {
        critical: criticalFindings.length,
        high: activeTimelineFindings.filter((f) => f.severity === 'high').length,
        medium: activeTimelineFindings.filter((f) => f.severity === 'medium').length,
        low: activeTimelineFindings.filter((f) => f.severity === 'low').length,
      }
    }
    return liveStats
  }, [timeline.preset, criticalFindings.length, activeTimelineFindings, liveStats])

  const trendData = useMemo<SeverityTrendPoint[]>(() => {
    // Custom timeline mode
    if (timeline.preset === 'custom') {
      if (activeTimelineFindings.length === 0) {
        return []
      }

      // Single day timeline: split into 3-hour intervals across the 24 hours
      if (timeline.mode === 'single' && timeline.singleDate) {
        const intervals = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00']
        return intervals.map((time, idx) => {
          const hour = idx * 3
          const cumulativeFindings = activeTimelineFindings.filter((f) => {
            const dateObj = new Date(f.discoveredAt)
            return dateObj.getUTCHours() <= hour
          })
          return {
            date: time,
            critical: cumulativeFindings.filter((f) => f.severity === 'critical').length,
            high: cumulativeFindings.filter((f) => f.severity === 'high').length,
            medium: cumulativeFindings.filter((f) => f.severity === 'medium').length,
            low: cumulativeFindings.filter((f) => f.severity === 'low').length,
          }
        })
      }

      // Range timeline: group findings by day chronologically
      if (timeline.mode === 'range' && timeline.startDate && timeline.endDate) {
        const dateMap = new Map<string, { critical: number; high: number; medium: number; low: number }>()
        activeTimelineFindings.forEach((f) => {
          const day = f.discoveredAt.slice(0, 10)
          const current = dateMap.get(day) || { critical: 0, high: 0, medium: 0, low: 0 }
          if (f.severity === 'critical') current.critical++
          else if (f.severity === 'high') current.high++
          else if (f.severity === 'medium') current.medium++
          else if (f.severity === 'low') current.low++
          dateMap.set(day, current)
        })

        const sortedDays = Array.from(dateMap.keys()).sort()
        if (sortedDays.length === 1) {
          const intervals = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00']
          return intervals.map((time, idx) => {
            const hour = idx * 3
            const cumulativeFindings = activeTimelineFindings.filter((f) => {
              const dateObj = new Date(f.discoveredAt)
              return dateObj.getUTCHours() <= hour
            })
            return {
              date: time,
              critical: cumulativeFindings.filter((f) => f.severity === 'critical').length,
              high: cumulativeFindings.filter((f) => f.severity === 'high').length,
              medium: cumulativeFindings.filter((f) => f.severity === 'medium').length,
              low: cumulativeFindings.filter((f) => f.severity === 'low').length,
            }
          })
        }

        return sortedDays.map((day) => ({
          date: day.slice(5),
          ...dateMap.get(day)!,
        }))
      }
    }

    // Compute dynamic trend points strictly from actual findings state
    const calculatePoints = (intervals: { label: string; iso: string }[]) => {
      return intervals.map((pt) => {
        const upTo = activeTimelineFindings.filter((f) => f.discoveredAt.slice(0, 10) <= pt.iso)
        return {
          date: pt.label,
          isoDate: pt.iso,
          critical: upTo.filter((f) => f.severity === 'critical').length,
          high: upTo.filter((f) => f.severity === 'high').length,
          medium: upTo.filter((f) => f.severity === 'medium').length,
          low: upTo.filter((f) => f.severity === 'low').length,
        }
      })
    }

    if (timeline.preset === '3M') {
      return calculatePoints([
        { label: 'Sep 01', iso: '2026-09-01' },
        { label: 'Sep 15', iso: '2026-09-15' },
        { label: 'Oct 01', iso: '2026-10-01' },
        { label: 'Oct 15', iso: '2026-10-15' },
        { label: 'Nov 01', iso: '2026-11-01' },
        { label: 'Nov 14', iso: '2026-11-14' },
      ])
    }

    if (timeline.preset === '6M') {
      return calculatePoints([
        { label: 'Jun 2026', iso: '2026-06-30' },
        { label: 'Jul 2026', iso: '2026-07-31' },
        { label: 'Aug 2026', iso: '2026-08-31' },
        { label: 'Sep 2026', iso: '2026-09-30' },
        { label: 'Oct 2026', iso: '2026-10-31' },
        { label: 'Nov 2026', iso: '2026-11-14' },
      ])
    }

    if (timeline.preset === '12M') {
      return calculatePoints([
        { label: 'Dec 2025', iso: '2025-12-31' },
        { label: 'Feb 2026', iso: '2026-02-28' },
        { label: 'Apr 2026', iso: '2026-04-30' },
        { label: 'Jun 2026', iso: '2026-06-30' },
        { label: 'Aug 2026', iso: '2026-08-31' },
        { label: 'Oct 2026', iso: '2026-10-31' },
        { label: 'Nov 2026', iso: '2026-11-14' },
      ])
    }

    return []
  }, [timeline, activeTimelineFindings, findings])

  const hasData = trendData.length > 0

  return (
    <section
      aria-label="Severity Progression Trend"
      className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
    >
      {/* Style to kill any browser SVG focus outline / clutter borders */}
      <style>{`
        .recharts-wrapper *:focus,
        .recharts-wrapper *:focus-visible,
        .recharts-surface *:focus,
        .recharts-surface *:focus-visible,
        svg *:focus,
        svg *:focus-visible {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Top Header Row with Dynamic Subtitle and Timeline Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-bold text-heading whitespace-nowrap">
            Severity Progression Trend
          </h2>
          <p className="text-xs text-desc">
            Individual trajectory curves across severity tiers ({timeline.label})
          </p>
        </div>
        <TimelineFilterPopover value={timeline} onChange={setTimeline} />
      </div>

      {/* Chart Area or Clean Zero-Data Empty State */}
      <div className="relative w-full h-80 sm:h-96 my-2" ref={chartContainerRef}>
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 rounded-xl bg-surface/20 border border-border/50">
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
              <AreaChart
                data={trendData}
                margin={{ top: 16, right: 20, left: 0, bottom: 12 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const payload = e.activePayload[0].payload
                    setSelectedPoint((prev: any) => (prev?.date === payload.date ? null : payload))
                    setSelectedCoords({ x: e.chartX ?? 200, y: e.chartY ?? 80 })
                  }
                }}
              >
                <defs>
                  <linearGradient id="trendGradientCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.status.red} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={colors.status.red} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trendGradientHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.status.orange} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={colors.status.orange} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trendGradientMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.status.yellow} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={colors.status.yellow} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trendGradientLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.status.blue} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={colors.status.blue} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border}
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  stroke={colors.caption}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                  label={{
                    value: 'Discovery Timeline',
                    position: 'insideBottom',
                    offset: -6,
                    fill: colors.caption,
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                />

                <YAxis
                  stroke={colors.caption}
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
                    offset: 12,
                    fill: colors.caption,
                    fontSize: 10,
                    fontWeight: 500,
                    style: { textAnchor: 'middle' },
                  }}
                />

                {/* Dotted indicator line on hover - NO popover on hover! */}
                <Tooltip
                  cursor={{ stroke: colors.border, strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={() => null}
                />

                <Area
                  type="monotone"
                  dataKey="medium"
                  name="Medium"
                  stroke={colors.status.yellow}
                  strokeWidth={2}
                  fill="url(#trendGradientMedium)"
                  activeDot={{
                    r: 5,
                    stroke: colors.canvas,
                    strokeWidth: 2,
                    fill: colors.status.yellow,
                    cursor: 'pointer',
                    onClick: (_e: any, eventPayload: any) => {
                      if (eventPayload?.payload) {
                        setActiveSeverity('medium')
                        setSelectedPoint((prev: any) =>
                          prev?.date === eventPayload.payload.date && activeSeverity === 'medium'
                            ? null
                            : eventPayload.payload
                        )
                        if (eventPayload.cx !== undefined && eventPayload.cy !== undefined) {
                          setSelectedCoords({ x: eventPayload.cx, y: eventPayload.cy })
                        }
                      }
                    },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  name="High"
                  stroke={colors.status.orange}
                  strokeWidth={2}
                  fill="url(#trendGradientHigh)"
                  activeDot={{
                    r: 5,
                    stroke: colors.canvas,
                    strokeWidth: 2,
                    fill: colors.status.orange,
                    cursor: 'pointer',
                    onClick: (_e: any, eventPayload: any) => {
                      if (eventPayload?.payload) {
                        setActiveSeverity('high')
                        setSelectedPoint((prev: any) =>
                          prev?.date === eventPayload.payload.date && activeSeverity === 'high'
                            ? null
                            : eventPayload.payload
                        )
                        if (eventPayload.cx !== undefined && eventPayload.cy !== undefined) {
                          setSelectedCoords({ x: eventPayload.cx, y: eventPayload.cy })
                        }
                      }
                    },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  name="Critical"
                  stroke={colors.status.red}
                  strokeWidth={2}
                  fill="url(#trendGradientCritical)"
                  activeDot={{
                    r: 5,
                    stroke: colors.canvas,
                    strokeWidth: 2,
                    fill: colors.status.red,
                    cursor: 'pointer',
                    onClick: (_e: any, eventPayload: any) => {
                      if (eventPayload?.payload) {
                        setActiveSeverity('critical')
                        setSelectedPoint((prev: any) =>
                          prev?.date === eventPayload.payload.date && activeSeverity === 'critical'
                            ? null
                            : eventPayload.payload
                        )
                        if (eventPayload.cx !== undefined && eventPayload.cy !== undefined) {
                          setSelectedCoords({ x: eventPayload.cx, y: eventPayload.cy })
                        }
                      }
                    },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  name="Low"
                  stroke={colors.status.blue}
                  strokeWidth={2}
                  fill="url(#trendGradientLow)"
                  activeDot={{
                    r: 5,
                    stroke: colors.canvas,
                    strokeWidth: 2,
                    fill: colors.status.blue,
                    cursor: 'pointer',
                    onClick: (_e: any, eventPayload: any) => {
                      if (eventPayload?.payload) {
                        setActiveSeverity('low')
                        setSelectedPoint((prev: any) =>
                          prev?.date === eventPayload.payload.date && activeSeverity === 'low'
                            ? null
                            : eventPayload.payload
                        )
                        if (eventPayload.cx !== undefined && eventPayload.cy !== undefined) {
                          setSelectedCoords({ x: eventPayload.cx, y: eventPayload.cy })
                        }
                      }
                    },
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Popover shown ONLY on User Selection (Click) - dynamically anchored near click coordinates */}
            {selectedPoint && (() => {
              const containerWidth = chartContainerRef.current?.clientWidth || 700
              const containerHeight = chartContainerRef.current?.clientHeight || 340
              const popoverWidth = 440
              const popoverHeight = 260
              const clickX = selectedCoords?.x ?? 200
              const clickY = selectedCoords?.y ?? 80

              // Dynamic horizontal placement:
              // If click is in the right half, position to the left of the point, else to the right
              let left = clickX > containerWidth / 2
                ? clickX - popoverWidth - 16
                : clickX + 16

              // Clamp left so it stays cleanly inside container
              left = Math.max(12, Math.min(left, containerWidth - popoverWidth - 12))

              // Dynamic vertical placement:
              // Align near the point's Y coordinate, clamped so it never overflows top or bottom
              let top = clickY - 60
              top = Math.max(12, Math.min(top, containerHeight - popoverHeight - 12))

              return (
                <div
                  className="absolute z-30 animate-in fade-in zoom-in-95 duration-150"
                  style={{
                    left,
                    top,
                  }}
                >
                  <ScanReportTooltip
                    selectedPoint={selectedPoint}
                    timelineFindings={activeTimelineFindings}
                    activeSeverity={activeSeverity}
                    onSeverityChange={setActiveSeverity}
                    onClose={() => setSelectedPoint(null)}
                  />
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* Bottom Row: Plain Legend + Bottom-Right Info Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-desc whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-red" aria-hidden="true" />
            <span>Critical ({timelineStats.critical})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-orange" aria-hidden="true" />
            <span>High ({timelineStats.high})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-yellow" aria-hidden="true" />
            <span>Medium ({timelineStats.medium})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0 bg-status-blue" aria-hidden="true" />
            <span>Low ({timelineStats.low})</span>
          </div>
        </div>

        {/* Bottom Right: High-visibility Info Note */}
        <div className="flex items-center gap-1.5 text-xs text-desc font-medium shrink-0 self-start sm:self-auto">
          <Info className="size-icon-xs text-desc shrink-0" aria-hidden="true" />
          <span>Click any point on the chart to analyze findings</span>
        </div>
      </div>
    </section>
  )
}
