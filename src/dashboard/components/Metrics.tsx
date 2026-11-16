import { useNavigate } from 'react-router-dom'
import { useDashboardAnalytics } from '../../store/useAppStore'

export default function Metrics() {
  const navigate = useNavigate()
  const { kpis, severityStats, slaAnalytics } = useDashboardAnalytics()

  return (
    <>
      {/* Metric Card 1: Total Scans */}
      <section
        aria-label="Total Scans"
        className="col-span-1 min-h-[140px] bg-card border border-border rounded-2xl p-3.5 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between min-h-[20px]">
          <span className="text-sm font-bold text-heading whitespace-nowrap">
            Total Scans
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span
            onClick={() => navigate('/scans')}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-heading cursor-pointer hover:underline"
            title="View all 12 scans"
          >
            12
          </span>
          <div className="flex flex-col items-start gap-0.5 text-xs">
            <span
              onClick={() => navigate('/scans?status=completed')}
              className="text-desc font-medium hover:underline hover:text-heading cursor-pointer transition-colors"
              title="View completed scans"
            >
              9 passed
            </span>
            <span
              onClick={() => navigate('/scans?status=failed')}
              className="text-status-red font-semibold hover:underline cursor-pointer transition-colors"
              title="View failed scans"
            >
              1 failed
            </span>
          </div>
        </div>

        <div className="flex items-center text-xs text-desc font-normal min-h-[16px]">
          <span
            onClick={() => navigate('/scans?status=running')}
            className="hover:underline hover:text-heading cursor-pointer transition-colors"
            title="View running scans"
          >
            {kpis.activeScansCount} running
          </span>
        </div>
      </section>

      {/* Metric Card 2: Open Findings */}
      <section
        aria-label="Open Findings"
        className="col-span-1 min-h-[140px] bg-card border border-border rounded-2xl p-3.5 flex flex-col justify-between"
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
            <span className="text-status-red font-semibold">{severityStats.critical} Critical</span>
            <span className="text-status-orange font-medium">{severityStats.high} High</span>
            <span className="text-status-yellow font-medium">{severityStats.medium} Medium</span>
            <span className="text-status-blue font-medium">{severityStats.low} Low</span>
          </div>
        </div>

        <div className="flex items-center text-xs text-desc font-normal min-h-[16px]">
          <span>Awaiting remediation</span>
        </div>
      </section>

      {/* Metric Card 3: Remediation SLA */}
      <section
        aria-label="Remediation SLA"
        className="col-span-1 min-h-[140px] bg-card border border-border rounded-2xl p-3.5 flex flex-col justify-between"
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
            <span className="text-status-red font-semibold">{slaAnalytics.breachedSlaCount} Breached</span>
            <span className="text-status-green font-semibold">{slaAnalytics.withinSlaCount} Within SLA</span>
          </div>
        </div>

        <div className="flex items-center text-xs text-desc font-normal min-h-[16px]">
          <span>MTTR: {slaAnalytics.overallMttrDays}d avg</span>
        </div>
      </section>
    </>
  )
}
