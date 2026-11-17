import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { Finding } from '../../types/schema'
import { isDateInTimeline } from './TimelineFilterPopover'

export interface EndpointItem {
  endpoint: string
  method: string
  path: string
  targetId: string
  targetName: string
  targetUrl: string
  primaryFindingId: string
  findings: Finding[]
  critical: number
  high: number
  medium: number
  low: number
  total: number
}

export default function TopVulnerableEndpointsWidget() {
  const navigate = useNavigate()
  const findings = useAppStore((state) => state.findings)
  const targets = useAppStore((state) => state.targets)
  const timeline = useAppStore((state) => state.dashboardTimeline)

  // Map targets by ID for fast lookup
  const targetMap = useMemo(() => {
    const map = new Map<string, { name: string; url: string }>()
    targets.forEach((t) => map.set(t.id, { name: t.name, url: t.url }))
    return map
  }, [targets])

  // Active findings filtered by Timeline Filter
  const activeTimelineFindings = useMemo(() => {
    return findings
      .filter((f) => f.status === 'open' || f.status === 'confirmed')
      .filter((f) => isDateInTimeline(f.discoveredAt, timeline))
  }, [findings, timeline])

  // Group active findings by normalized endpoint
  const endpointList = useMemo<EndpointItem[]>(() => {
    const map = new Map<string, EndpointItem>()

    activeTimelineFindings.forEach((f) => {
      const loc = f.location || '/'
      const parts = loc.trim().split(/\s+/)
      let method = 'GET'
      let path = loc
      if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(parts[0].toUpperCase())) {
        method = parts[0].toUpperCase()
        path = parts.slice(1).join(' ')
      }

      const key = `${method} ${path}`
      const target = targetMap.get(f.targetId)

      if (!map.has(key)) {
        map.set(key, {
          endpoint: key,
          method,
          path,
          targetId: f.targetId,
          targetName: target?.name || 'Target Asset',
          targetUrl: target?.url || '',
          primaryFindingId: f.id,
          findings: [],
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        })
      }

      const item = map.get(key)!
      item.findings.push(f)
      item.total++
      if (f.severity === 'critical') item.critical++
      else if (f.severity === 'high') item.high++
      else if (f.severity === 'medium') item.medium++
      else if (f.severity === 'low') item.low++
    })

    // Sort by severity risk density
    return Array.from(map.values())
      .sort((a, b) => {
        const scoreA = a.critical * 4 + a.high * 2 + a.medium + a.total * 0.1
        const scoreB = b.critical * 4 + b.high * 2 + b.medium + b.total * 0.1
        return scoreB - scoreA
      })
      .slice(0, 5)
  }, [activeTimelineFindings, targetMap])

  return (
    <section
      aria-label="Top Vulnerable Endpoints"
      className="col-span-1 bg-card border border-border rounded-2xl flex flex-col justify-between overflow-hidden"
    >
      {/* Top Header Row with Comfortable Padding matching LiveScans */}
      <div className="flex items-center justify-between min-h-[32px] p-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-heading whitespace-nowrap">
            Top Vulnerable Endpoints
          </span>
          <span className="text-xs text-desc font-normal">
            ({endpointList.length} routes)
          </span>
        </div>
      </div>

      {/* Main body: Flush edge-to-edge dividing borders without inner cards or lateral spacing padding (Exact LiveScans Architecture) */}
      <div className="flex-1 min-h-[260px] sm:min-h-[280px] divide-y divide-border border-t border-border overflow-y-auto">
        {endpointList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Activity className="size-8 text-desc/40 mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-heading">
              No vulnerability data recorded on {timeline.label}
            </p>
            <p className="text-xs text-desc mt-1 max-w-sm">
              0 findings were discovered during this selection. Select a different date or preset timeline.
            </p>
          </div>
        ) : (
          endpointList.map((item) => {
            // Pick most urgent finding ID for direct navigation
            const primaryFinding =
              item.findings.find((f) => f.severity === 'critical') ||
              item.findings.find((f) => f.severity === 'high') ||
              item.findings[0]
            const targetFindingId = primaryFinding?.id || item.primaryFindingId

            return (
              <div
                key={item.endpoint}
                onClick={() => navigate(`/findings?findingId=${targetFindingId}`)}
                title={`Open finding #${targetFindingId} on ${item.endpoint}`}
                className="p-4 bg-transparent hover:bg-surface transition-colors duration-150 cursor-pointer space-y-2"
              >
                {/* Row 1: Plain method text (no bordered badge box), Path, and Finding Reference ID */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    <span className="text-xs font-mono font-bold text-heading shrink-0 select-none">
                      {item.method}
                    </span>
                    <span className="text-sm font-bold text-heading font-mono truncate" title={item.path}>
                      {item.path}
                    </span>
                    <span className="text-xs font-mono text-caption shrink-0">
                      #{targetFindingId}
                    </span>
                  </div>

                  {/* Open Count / Vulnerabilities */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {item.critical > 0 && (
                        <span className="text-status-red">
                          {item.critical} Critical
                        </span>
                      )}
                      {item.high > 0 && (
                        <span className="text-status-orange">
                          {item.high} High
                        </span>
                      )}
                      {item.medium > 0 && item.critical === 0 && item.high === 0 && (
                        <span className="text-status-yellow">
                          {item.medium} Medium
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-heading">
                      {item.total} open
                    </span>
                  </div>
                </div>

                {/* Row 2: Target Domain URL */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-xs text-heading font-mono truncate block flex-1 min-w-0" title={item.targetUrl}>
                    {item.targetUrl || item.targetName}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
