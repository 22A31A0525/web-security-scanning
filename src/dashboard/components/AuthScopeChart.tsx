import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowUpRight, Info, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import Button from '../../ui/Button'
import TimelineFilterPopover, {
  DEFAULT_TIMELINE_FILTER,
  TimelineFilter,
  isDateInTimeline,
} from './TimelineFilterPopover'

// Pull single-source-of-truth palette directly from tailwind.config.js
// @ts-ignore
import tailwindConfig from '../../../tailwind.config.js'

const colors = tailwindConfig.theme.extend.colors
const SCOPE_COLORS = colors.scope

export default function AuthScopeChart() {
  const [timeline, setTimeline] = useState<TimelineFilter>(DEFAULT_TIMELINE_FILTER)
  const [selectedScope, setSelectedScope] = useState<'authenticated' | 'unauthenticated' | null>(null)
  const [popoverPlacement, setPopoverPlacement] = useState<'right' | 'left' | 'bottom'>('right')

  const containerRef = useRef<HTMLElement>(null)

  const targets = useAppStore((state) => state.targets)
  const navigate = useNavigate()

  // Targets filtered by timeline (or fallback to all targets)
  const timelineTargets = useMemo(() => {
    const matched = targets.filter((t) => isDateInTimeline(t.lastScannedAt, timeline))
    return matched.length > 0 ? matched : targets
  }, [targets, timeline])

  // Recent targets sorted chronologically (latest scanned first)
  const authenticatedTargets = useMemo(() => {
    return [...timelineTargets]
      .filter((t) => t.authenticated)
      .sort((a, b) => new Date(b.lastScannedAt).getTime() - new Date(a.lastScannedAt).getTime())
  }, [timelineTargets])

  const unauthenticatedTargets = useMemo(() => {
    return [...timelineTargets]
      .filter((t) => !t.authenticated)
      .sort((a, b) => new Date(b.lastScannedAt).getTime() - new Date(a.lastScannedAt).getTime())
  }, [timelineTargets])

  const authCount = authenticatedTargets.length
  const unauthCount = unauthenticatedTargets.length
  const totalTargets = timelineTargets.length

  const authScopeData = useMemo(() => {
    if (totalTargets === 0) {
      return [{ name: 'Empty', value: 1, color: colors.border, key: 'empty' }]
    }
    return [
      { name: 'Authenticated', value: authCount, color: SCOPE_COLORS.authenticated, key: 'authenticated' },
      { name: 'Unauthenticated', value: unauthCount, color: SCOPE_COLORS.unauthenticated, key: 'unauthenticated' },
    ]
  }, [totalTargets, authCount, unauthCount])

  const activeTargets = selectedScope === 'authenticated' ? authenticatedTargets : unauthenticatedTargets
  const hasMoreTargets = activeTargets.length > 3

  const updatePlacement = (scope: 'authenticated' | 'unauthenticated') => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setPopoverPlacement('bottom')
    } else {
      // Recharts standard angle order:
      // Entry 0 (Authenticated, 62.5%): spans bottom/left half -> place popup on LEFT
      // Entry 1 (Unauthenticated, 37.5%): spans top/right half -> place popup on RIGHT
      setPopoverPlacement(scope === 'authenticated' ? 'left' : 'right')
    }
  }

  // Pure Click-Based Selection Behavior (exact same format as the graph)
  const handleSliceClick = (scope: 'authenticated' | 'unauthenticated') => {
    if (selectedScope === scope) {
      setSelectedScope(null)
    } else {
      setSelectedScope(scope)
      updatePlacement(scope)
    }
  }

  const handleClose = () => {
    setSelectedScope(null)
  }

  // Close when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedScope(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Tightly anchored directly outside the donut ring (outerRadius is 86px)
  const getPlacementStyles = () => {
    if (popoverPlacement === 'bottom' || (typeof window !== 'undefined' && window.innerWidth < 640)) {
      return {
        top: 'calc(50% + 92px)',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    }
    if (popoverPlacement === 'right') {
      return {
        left: 'calc(50% + 92px)',
        top: '50%',
        transform: 'translateY(-50%)',
      }
    }
    return {
      right: 'calc(50% + 92px)',
      top: '50%',
      transform: 'translateY(-50%)',
    }
  }

  return (
    <section
      ref={containerRef}
      aria-label="Target Authentication Scope"
      className="col-span-1 h-full min-h-[320px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between relative"
    >
      {/* Top Row: Title and Timeline Selector */}
      <div className="flex items-center justify-between min-h-[32px] gap-2">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Authentication Scope
        </span>
        <TimelineFilterPopover value={timeline} onChange={setTimeline} />
      </div>

      {/* Middle: Clean Donut Chart + Anchored Tightly Beside the Ring */}
      <div className="relative w-full h-48 sm:h-52 flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={authScopeData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={86}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              cursor="pointer"
              isAnimationActive={false}
              onClick={(entry: any) => {
                if (entry && (entry.key === 'authenticated' || entry.key === 'unauthenticated')) {
                  handleSliceClick(entry.key)
                }
              }}
            >
              {authScopeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={selectedScope === entry.key ? '#ffffff' : colors.card}
                  strokeWidth={selectedScope === entry.key ? 2 : 1}
                  className="cursor-pointer transition-all duration-150 outline-none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Donut Hole Center Content - Reflects selected state cleanly */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          {selectedScope === 'authenticated' ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-scope-authenticated leading-none">
                {authCount}
              </span>
              <span className="text-xs text-scope-authenticated font-medium leading-none mt-1">
                Authenticated
              </span>
            </>
          ) : selectedScope === 'unauthenticated' ? (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-scope-unauthenticated leading-none">
                {unauthCount}
              </span>
              <span className="text-xs text-scope-unauthenticated font-medium leading-none mt-1">
                Unauthenticated
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading leading-none">
                {totalTargets}
              </span>
              <span className="text-xs text-desc leading-none mt-1">
                Total Targets
              </span>
            </>
          )}
        </div>

        {/* Refined Popup Anchored on User Selection (Click) */}
        {selectedScope && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute z-50 w-[350px] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150"
            style={getPlacementStyles()}
          >
            {/* Directional Arrow Pointer touching the slice */}
            {popoverPlacement === 'right' && (
              <div
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-l border-b border-border rotate-45 pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
            {popoverPlacement === 'left' && (
              <div
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-r border-t border-border rotate-45 pointer-events-none z-10"
                aria-hidden="true"
              />
            )}
            {popoverPlacement === 'bottom' && (
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-border rotate-45 pointer-events-none z-10"
                aria-hidden="true"
              />
            )}

            {/* Inner Card Container: Solid bg-card (#0d1117) */}
            <div className="w-full bg-card rounded-xl overflow-hidden flex flex-col z-20">
              {/* Header: Solid bg-surface (#161b22) + border-border with single line tabs */}
              <div className="px-2.5 py-1.5 flex items-center justify-between text-xs bg-surface border-b border-border gap-1.5">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedScope('authenticated')
                      updatePlacement('authenticated')
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                      selectedScope === 'authenticated'
                        ? 'bg-card border border-border text-scope-authenticated font-semibold shadow-sm'
                        : 'text-desc hover:text-heading border border-transparent'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full bg-scope-authenticated shrink-0"
                      style={{ backgroundColor: SCOPE_COLORS.authenticated }}
                    />
                    <span>Authenticated ({authCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedScope('unauthenticated')
                      updatePlacement('unauthenticated')
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                      selectedScope === 'unauthenticated'
                        ? 'bg-card border border-border text-scope-unauthenticated font-semibold shadow-sm'
                        : 'text-desc hover:text-heading border border-transparent'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full bg-scope-unauthenticated shrink-0"
                      style={{ backgroundColor: SCOPE_COLORS.unauthenticated }}
                    />
                    <span>Unauthenticated ({unauthCount})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  title="Close"
                  aria-label="Close"
                  className="p-1 rounded-md hover:bg-card text-desc hover:text-heading transition-colors cursor-pointer shrink-0"
                >
                  <X className="size-3.5 shrink-0" />
                </button>
              </div>

              {/* Subheader: Solid bg-card + border-border with Proper Case */}
              <div className="px-3 py-1.5 min-h-[34px] flex items-center justify-between bg-card border-b border-border text-xs">
                <span
                  className={`font-semibold text-xs ${
                    selectedScope === 'authenticated' ? 'text-scope-authenticated' : 'text-scope-unauthenticated'
                  }`}
                >
                  {selectedScope === 'authenticated' ? 'Authenticated Targets' : 'Unauthenticated Targets'}
                </span>
                {hasMoreTargets && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label="Show all targets"
                    onClick={() => navigate('/targets')}
                    className="px-2 py-0.5 text-xs h-6 border border-border shadow-sm flex items-center gap-1 bg-surface hover:bg-surface text-heading"
                  >
                    <span>Show all</span>
                    <ArrowUpRight className="size-3 text-desc shrink-0" aria-hidden="true" />
                  </Button>
                )}
              </div>

              {/* List of 3 Recent Targets: Consistently 'Bearer' for all authenticated targets */}
              <div className="divide-y divide-border max-h-52 overflow-y-auto bg-card">
                {activeTargets.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-desc text-center bg-card">
                    No targets found
                  </div>
                ) : (
                  activeTargets.slice(0, 3).map((target) => {
                    const authLabel = target.authenticated ? 'Bearer' : 'Public'

                    return (
                      <div
                        key={target.id}
                        onClick={() => navigate(`/targets?targetId=${target.id}`)}
                        className="px-3 py-2 bg-card hover:bg-surface transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className="text-xs font-semibold text-heading truncate group-hover:text-scope-authenticated transition-colors"
                            title={target.name}
                          >
                            {target.name}
                          </span>
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-surface border border-border text-body shrink-0 font-medium">
                            {authLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-desc font-mono truncate mt-0.5" title={target.url}>
                          {target.url}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Clean minimal Legend with config colors & Info Hint */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSliceClick('authenticated')}
            className={`flex items-center gap-1.5 cursor-pointer truncate text-left transition-colors py-0.5 rounded ${
              selectedScope === 'authenticated' ? 'text-heading font-medium' : 'text-desc hover:text-heading'
            }`}
            title="Click to view authenticated targets"
          >
            <span
              className="w-2 h-2 rounded-full bg-scope-authenticated shrink-0"
              style={{ backgroundColor: SCOPE_COLORS.authenticated }}
              aria-hidden="true"
            />
            <span className="truncate">Authenticated ({authCount})</span>
          </button>
          <button
            type="button"
            onClick={() => handleSliceClick('unauthenticated')}
            className={`flex items-center gap-1.5 cursor-pointer truncate text-left transition-colors py-0.5 rounded ${
              selectedScope === 'unauthenticated' ? 'text-heading font-medium' : 'text-desc hover:text-heading'
            }`}
            title="Click to view unauthenticated targets"
          >
            <span
              className="w-2 h-2 rounded-full bg-scope-unauthenticated shrink-0"
              style={{ backgroundColor: SCOPE_COLORS.unauthenticated }}
              aria-hidden="true"
            />
            <span className="truncate">Unauthenticated ({unauthCount})</span>
          </button>
        </div>

        {/* Bottom Right: Click to inspect hint (matching graph UX) */}
        <div className="flex items-center gap-1 text-[11px] text-desc font-medium shrink-0">
          <Info className="size-3 text-desc shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Click to inspect</span>
        </div>
      </div>
    </section>
  )
}
