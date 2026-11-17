import { useMemo } from 'react'
import { useDashboardAnalytics } from '../../store/useAppStore'

export default function SecurityScore() {
  const { posture } = useDashboardAnalytics()

  // Calculate arc geometry for the semi-circular gauge (Prowler ThreatScore style)
  // Radius = 42, circumference = 2 * PI * 42 ≈ 263.89
  // Semi-circle perimeter = PI * 42 ≈ 131.95
  const radius = 42
  const semiCircumference = Math.PI * radius
  const normalizedScore = Math.max(0, Math.min(100, posture.score))
  const strokeDashoffset = semiCircumference - (normalizedScore / 100) * semiCircumference

  const { strokeColor, textColor } = useMemo(() => {
    if (posture.score >= 80) {
      return {
        strokeColor: 'var(--color-status-green, #22c55e)',
        textColor: 'text-status-green',
      }
    }
    if (posture.score >= 60) {
      return {
        strokeColor: 'var(--color-status-yellow, #eab308)',
        textColor: 'text-status-yellow',
      }
    }
    return {
      strokeColor: 'var(--color-status-red, #f04343)',
      textColor: 'text-status-red',
    }
  }, [posture.score])

  return (
    <section
      aria-label="ThreatScore and Security Posture Card"
      className="col-span-1 min-h-[175px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between"
    >
      {/* Top Row: Title & Threat Grade inline text (Clean, No Icon) */}
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-sm font-bold text-heading whitespace-nowrap">
          ThreatScore
        </span>
        <span className={`text-xs font-semibold ${textColor}`}>
          Grade {posture.grade}
        </span>
      </div>

      {/* Middle Row: Semi-Circular Radial Gauge */}
      <div className="flex items-center justify-center relative py-1 my-[-4px]">
        <svg
          viewBox="0 0 100 58"
          className="w-28 sm:w-32 overflow-visible select-none"
          aria-hidden="true"
        >
          {/* Background Track Arc */}
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            className="text-surface"
          />
          {/* Active Metric Score Arc */}
          <path
            d="M 8 50 A 42 42 0 0 1 92 50"
            fill="none"
            stroke={strokeColor}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={semiCircumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text inside the gauge */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
              {posture.score}
            </span>
            <span className="text-[11px] text-desc font-normal ml-0.5">
              %
            </span>
          </div>
          <span className="text-[10px] text-desc font-medium leading-none mt-0.5">
            Posture
          </span>
        </div>
      </div>

      {/* Bottom Row: Posture Status Label & Target Coverage / Urgent Count */}
      <div className="flex items-center justify-between text-xs text-desc font-normal min-h-[16px] pt-1">
        <span className="truncate">{posture.statusLabel}</span>
        <span
          className={`font-semibold text-xs shrink-0 ${
            posture.urgentCount > 0 ? 'text-status-red' : 'text-status-green'
          }`}
          title="Critical and High findings requiring immediate attention"
        >
          {posture.urgentCount} Urgent
        </span>
      </div>
    </section>
  )
}
