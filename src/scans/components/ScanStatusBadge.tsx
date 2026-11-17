import { Loader2, Clock, CheckCircle2, AlertCircle, Slash } from 'lucide-react'
import type { ScanStatus } from '../../types/schema'

export interface ScanStatusBadgeProps {
  status: ScanStatus
  phase?: string
  progress?: number
  className?: string
  iconOnly?: boolean
}

/**
 * Standard scan status indicator with animated symbols:
 * - running: animated circular spinner (Loader2)
 * - queued: pulsing clock icon
 * - completed: crisp checkmark icon
 * - failed: alert circle icon
 * - cancelled: slash / stop icon
 */
export default function ScanStatusBadge({
  status,
  phase,
  progress,
  className = '',
  iconOnly = false,
}: ScanStatusBadgeProps) {
  switch (status) {
    case 'running': {
      const label = phase || (progress !== undefined && progress > 50 ? 'Auditing' : 'Running')
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-status-blue select-none ${className}`}
          title={`Running (${progress ?? 0}%)`}
        >
          <Loader2 className="size-3 animate-spin shrink-0 text-status-blue" aria-hidden="true" />
          {!iconOnly && <span>{label}</span>}
        </span>
      )
    }

    case 'queued':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-status-yellow select-none ${className}`}
          title="Queued"
        >
          <Clock className="size-3 shrink-0 text-status-yellow animate-pulse" aria-hidden="true" />
          {!iconOnly && <span>Queued</span>}
        </span>
      )

    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-status-green select-none ${className}`}
          title="Completed"
        >
          <CheckCircle2 className="size-3 shrink-0 text-status-green" aria-hidden="true" />
          {!iconOnly && <span>Completed</span>}
        </span>
      )

    case 'failed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-status-red select-none ${className}`}
          title="Failed"
        >
          <AlertCircle className="size-3 shrink-0 text-status-red" aria-hidden="true" />
          {!iconOnly && <span>Failed</span>}
        </span>
      )

    case 'cancelled':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold text-caption select-none ${className}`}
          title="Cancelled"
        >
          <Slash className="size-3 shrink-0 text-caption" aria-hidden="true" />
          {!iconOnly && <span>Cancelled</span>}
        </span>
      )
  }
}
