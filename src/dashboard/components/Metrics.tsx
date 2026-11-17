import { useDashboardAnalytics, useAppStore } from '../../store/useAppStore'
import { isDateInTimeline } from './TimelineFilterPopover'

export function TotalTargetsCard() {
  const targets = useAppStore((state) => state.targets)
  const findings = useAppStore((state) => state.findings)
  const scans = useAppStore((state) => state.scans)
  const timeline = useAppStore((state) => state.dashboardTimeline)

  // Filter targets based on timeline activity
  const timelineFilteredFindings = findings.filter((f) =>
    isDateInTimeline(f.discoveredAt, timeline)
  )
  const timelineFilteredScans = scans.filter((s) =>
    isDateInTimeline(s.startedAt, timeline)
  )
  const activeTargetIds = new Set([
    ...timelineFilteredScans.map((s) => s.targetId),
    ...timelineFilteredFindings.map((f) => f.targetId),
  ])
  const effectiveTargets =
    activeTargetIds.size > 0
      ? targets.filter((t) => activeTargetIds.has(t.id))
      : targets

  const prodTargetsCount = effectiveTargets.filter((t) => t.environment === 'production').length
  const stagingTargetsCount = effectiveTargets.filter((t) => t.environment === 'staging').length
  const devTargetsCount = effectiveTargets.filter((t) => t.environment === 'dev').length
  const unauthCount = effectiveTargets.filter((t) => !t.authenticated).length
  const unauthPct = effectiveTargets.length > 0 ? Math.round((unauthCount / effectiveTargets.length) * 100) : 0

  return (
    <section
      aria-label="Total Targets"
      className="col-span-1 min-h-[175px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Total Targets
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading">
          {effectiveTargets.length}
        </span>
        <div className="flex flex-col items-start gap-0.5 text-xs">
          <span className="text-desc font-medium">
            {prodTargetsCount} production
          </span>
          <span className="text-desc font-medium">
            {stagingTargetsCount} staging
          </span>
          <span className="text-desc font-medium">
            {devTargetsCount} dev
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-desc font-normal min-h-[16px] pt-1">
        <span>Active attack surface</span>
        <span
          className={unauthPct > 0 ? 'text-status-yellow font-medium' : 'text-status-green font-medium'}
          title="Targets scanned without authentication credentials"
        >
          {unauthPct}% unauth
        </span>
      </div>
    </section>
  )
}

export function TotalScansCard() {
  const scans = useAppStore((state) => state.scans)
  const timeline = useAppStore((state) => state.dashboardTimeline)

  const timelineFilteredScans = scans.filter((s) =>
    isDateInTimeline(s.startedAt, timeline)
  )
  const effectiveScans =
    timelineFilteredScans.length > 0 ? timelineFilteredScans : scans

  const completedScansCount = effectiveScans.filter((s) => s.status === 'completed').length
  const failedScansCount = effectiveScans.filter((s) => s.status === 'failed').length
  const runningScansCount = effectiveScans.filter(
    (s) => s.status === 'running' || s.status === 'queued'
  ).length
  const successRatePct = effectiveScans.length > 0 ? Math.round((completedScansCount / effectiveScans.length) * 100) : 0

  return (
    <section
      aria-label="Total Scans"
      className="col-span-1 min-h-[175px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Total Scans
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading">
          {effectiveScans.length}
        </span>
        <div className="flex flex-col items-start gap-0.5 text-xs">
          <span className="text-desc font-medium">
            {completedScansCount} passed
          </span>
          <span className="text-status-red font-semibold">
            {failedScansCount} failed
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-desc font-normal min-h-[16px] pt-1">
        <span>{runningScansCount} active</span>
        <span
          className={successRatePct >= 80 ? 'text-status-green font-medium' : 'text-status-yellow font-medium'}
          title="Scan success rate: completed / total scans"
        >
          {successRatePct}% success
        </span>
      </div>
    </section>
  )
}

export function OpenFindingsCard() {
  const findings = useAppStore((state) => state.findings)
  const timeline = useAppStore((state) => state.dashboardTimeline)
  const { kpis, severityStats } = useDashboardAnalytics()

  const timelineFilteredFindings = findings.filter((f) =>
    isDateInTimeline(f.discoveredAt, timeline)
  )
  const effectiveFindings =
    timelineFilteredFindings.length > 0 ? timelineFilteredFindings : findings

  const resolvedCount = effectiveFindings.filter((f) => f.status === 'resolved').length
  const totalFindings = effectiveFindings.length
  const resolvedPct = totalFindings > 0 ? Math.round((resolvedCount / totalFindings) * 100) : 0

  return (
    <section
      aria-label="Open Findings"
      className="col-span-1 min-h-[175px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Open Findings
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading">
          {kpis.totalOpenFindings}
        </span>
        <div className="flex flex-col items-start gap-0.5 text-xs">
          <span className="text-status-red font-semibold">
            {severityStats.critical} Critical
          </span>
          <span className="text-status-orange font-medium">
            {severityStats.high} High
          </span>
          <span className="text-status-yellow font-medium">
            {severityStats.medium} Medium
          </span>
          <span className="text-status-blue font-medium">
            {severityStats.low} Low
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-desc font-normal min-h-[16px] pt-1">
        <span>Awaiting remediation</span>
        <span
          className="text-status-green font-medium"
          title="Resolved percentage: resolved / total findings"
        >
          {resolvedPct}% resolved
        </span>
      </div>
    </section>
  )
}

export function ScanRuntimeCard() {
  const scans = useAppStore((state) => state.scans)
  const { avgRuntime, totalCrawledEndpoints } = useDashboardAnalytics()

  // Find the most recent finished scan for actionable last scan duration
  const completedScans = scans
    .filter((s) => (s.status === 'completed' || s.status === 'failed') && s.durationSec > 0)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  const lastScan = completedScans[0]
  const lastScanDuration = lastScan
    ? lastScan.durationSec >= 60
      ? `${Math.floor(lastScan.durationSec / 60)}m ${lastScan.durationSec % 60}s`
      : `${lastScan.durationSec}s`
    : '--'

  return (
    <section
      aria-label="Scan Performance"
      className="col-span-1 min-h-[175px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Scan Runtime
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading">
          {avgRuntime}
        </span>
        <div className="flex flex-col items-start gap-0.5 text-xs">
          <span className="text-desc font-medium">
            {totalCrawledEndpoints} endpoints
          </span>
          <span className="text-caption font-medium">
            crawled depth
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-desc font-normal min-h-[16px] pt-1">
        <span>Avg completion</span>
        <span
          className="text-desc font-medium font-mono text-[11px]"
          title="Duration of the most recently executed scan"
        >
          Last: {lastScanDuration}
        </span>
      </div>
    </section>
  )
}

export function RemediationSlaCard() {
  const { slaAnalytics } = useDashboardAnalytics()

  return (
    <section
      aria-label="Remediation SLA"
      className="col-span-1 min-h-[175px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Remediation SLA
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading">
          {slaAnalytics.slaCompliancePct}%
        </span>
        <div className="flex flex-col items-start gap-0.5 text-xs">
          <span className="text-status-red font-semibold">
            {slaAnalytics.breachedSlaCount} Breached
          </span>
          <span className="text-status-green font-semibold">
            {slaAnalytics.withinSlaCount} Within SLA
          </span>
        </div>
      </div>

      <div className="flex items-center text-xs text-desc font-normal min-h-[16px] pt-1">
        <span>Target resolution rate</span>
      </div>
    </section>
  )
}

export default function Metrics() {
  return (
    <>
      <TotalTargetsCard />
      <TotalScansCard />
      <OpenFindingsCard />
      <ScanRuntimeCard />
      <RemediationSlaCard />
    </>
  )
}
