import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Globe,
  Lock,
  Unlock,
  Play,
  Pencil,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react'
import Button from '../ui/Button'
import type { TargetWithTelemetry, Target } from '../types/schema'

interface TargetDetailDrawerProps {
  target: TargetWithTelemetry | Target | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (target: TargetWithTelemetry | Target) => void
  onRunScan?: (target: TargetWithTelemetry | Target) => void
}

export default function TargetDetailDrawer({
  target,
  isOpen,
  onClose,
  onEdit,
  onRunScan,
}: TargetDetailDrawerProps) {
  const navigate = useNavigate()

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !target) return null

  const telemetry = target as TargetWithTelemetry
  const severityCounts = telemetry.severityCounts || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }

  const grade = target.riskScore || 'A'
  const gradeColor =
    grade === 'A'
      ? 'text-status-green'
      : grade === 'B'
      ? 'text-status-blue'
      : grade === 'C'
      ? 'text-status-orange'
      : 'text-status-red'

  const formattedLastScanned = target.lastScannedAt
    ? new Date(target.lastScannedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Never'

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          aria-label="Target Detail Drawer"
          className="w-screen max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Top Drawer Header */}
          <div className="p-6 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Target Name */}
                <h2 className="text-h2 text-heading truncate">
                  {target.name}
                </h2>

                {/* ID, Environment & Risk Grade */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                  <span className="font-mono font-semibold text-desc">
                    #{target.id}
                  </span>

                  <span className={`font-semibold ${gradeColor}`}>
                    Grade {grade}
                  </span>

                  <span className="text-desc font-medium capitalize">
                    {target.environment}
                  </span>

                  <span className="text-desc font-medium">
                    {target.authenticated ? (
                      <span className="inline-flex items-center gap-1 text-scope-authenticated">
                        <Lock className="size-icon-xs text-scope-authenticated" />
                        Bearer Auth
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-desc">
                        <Unlock className="size-icon-xs text-desc" />
                        Public Scope
                      </span>
                    )}
                  </span>
                </div>

                {/* Target URL */}
                <a
                  href={target.url.startsWith('http') ? target.url : `https://${target.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-heading hover:underline flex items-center gap-1.5 mt-2 truncate max-w-sm transition-colors group"
                >
                  <Globe className="size-icon-xs text-desc group-hover:text-heading shrink-0" />
                  <span className="truncate">{target.url}</span>
                  <ExternalLink className="size-icon-xs text-desc group-hover:text-heading shrink-0" />
                </a>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="size-icon-lg rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-md text-desc hover:text-heading" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {onRunScan && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onRunScan(target)}
                  className="cursor-pointer"
                >
                  <Play className="size-icon-xs fill-current" />
                  <span>Run Scan</span>
                </Button>
              )}

              {onEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(target)}
                  className="border border-border cursor-pointer"
                >
                  <Pencil className="size-icon-xs text-desc" />
                  <span>Edit Target</span>
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose()
                  navigate(`/findings?targetId=${target.id}`)
                }}
                className="border border-border cursor-pointer"
              >
                <ShieldAlert className="size-icon-xs text-desc" />
                <span>Findings ({target.openFindings || 0})</span>
                <ArrowUpRight className="size-icon-xs text-desc" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose()
                  navigate(`/scans?targetId=${target.id}`)
                }}
                className="border border-border cursor-pointer"
              >
                <Activity className="size-icon-xs text-desc" />
                <span>Scans</span>
                <ArrowUpRight className="size-icon-xs text-desc" />
              </Button>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
            {/* 1. Telemetry Overview */}
            <div>
              <h3 className="text-xs font-semibold text-heading mb-2.5">
                Telemetry Overview
              </h3>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-desc text-[11px]">Open Findings</div>
                  <div className="font-mono text-base font-bold text-heading mt-0.5">
                    {target.openFindings || 0}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Routable Endpoints</div>
                  <div className="font-mono text-base font-bold text-heading mt-0.5">
                    {telemetry.endpointsCount || 1}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Risk Level</div>
                  <div className="text-xs font-semibold text-heading mt-1">
                    {telemetry.riskLevel || 'Low'}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Last Scanned</div>
                  <div className="text-xs font-mono font-semibold text-heading mt-1 truncate">
                    {formattedLastScanned}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Vulnerability Severity Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-semibold text-heading">
                  Vulnerability Breakdown
                </h3>
                <span className="font-mono text-xs font-bold text-heading">
                  {(severityCounts.critical || 0) +
                    (severityCounts.high || 0) +
                    (severityCounts.medium || 0) +
                    (severityCounts.low || 0)}{' '}
                  Total
                </span>
              </div>

              {(severityCounts.critical || 0) +
                (severityCounts.high || 0) +
                (severityCounts.medium || 0) +
                (severityCounts.low || 0) >
              0 ? (
                <div className="flex items-center gap-6 text-xs text-desc py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {severityCounts.critical || 0}
                    </span>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {severityCounts.high || 0}
                    </span>
                    <span>High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {severityCounts.medium || 0}
                    </span>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-heading text-sm">
                      {severityCounts.low || 0}
                    </span>
                    <span>Low</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-desc py-1">
                  Clean target posture. Zero active vulnerabilities detected across endpoints.
                </div>
              )}
            </div>

            {/* 3. Authentication Configuration (Clean Rows, No Cards) */}
            <div>
              <h3 className="text-xs font-semibold text-heading mb-2">
                Authentication Scope
              </h3>
              <div className="text-xs space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-desc text-[11px]">Authentication Mode:</span>
                  <span className="font-semibold text-heading">
                    {target.authenticated ? 'Authenticated Scan' : 'Unauthenticated / Passive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-desc text-[11px]">Credential Strategy:</span>
                  <span className="font-mono text-heading">
                    {target.authenticated ? 'Bearer Token' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-desc text-[11px]">Crawler Authorization:</span>
                  <span className="font-mono text-caption text-[11px]">
                    {target.authenticated ? 'Authorization: Bearer <active>' : 'Passive public endpoints'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Target Description */}
            <div>
              <h3 className="text-xs font-semibold text-heading mb-1.5">
                Target Description
              </h3>
              <p className="text-xs text-body leading-relaxed">
                {target.description ||
                  'Monitored web application asset enrolled in continuous vulnerability scanning and attack surface discovery.'}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>,
    document.body
  )
}
