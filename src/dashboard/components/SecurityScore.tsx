import { useDashboardAnalytics } from '../../store/useAppStore'

export default function SecurityScore() {
  const { posture } = useDashboardAnalytics()

  const gradeTextColor =
    posture.grade.startsWith('A')
      ? 'text-status-green'
      : posture.grade === 'B'
      ? 'text-status-yellow'
      : 'text-status-red'

  return (
    <section
      aria-label="Security Posture Score Card"
      className="col-span-1 min-h-[140px] bg-card border border-border rounded-2xl p-3.5 flex flex-col justify-between"
    >
      {/* Top Row: Title Only */}
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          Security Posture
        </span>
      </div>

      {/* Middle Row: Numerical Score and Right Details Stack (Grade & Coverage) */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-heading">
            {posture.score}
          </span>
          <span className="text-xs text-desc font-normal">
            / 100
          </span>
        </div>
        <div className="flex flex-col items-start gap-0.5 text-xs">
          <span className={`font-semibold ${gradeTextColor}`}>
            Grade {posture.grade}
          </span>
          <span className="text-desc font-medium">
            {posture.authCoveragePct}% coverage
          </span>
        </div>
      </div>

      {/* Bottom Row: Risk Subtitle */}
      <div className="flex items-center text-xs text-desc font-normal min-h-[16px]">
        <span>{posture.statusLabel}</span>
      </div>
    </section>
  )
}
