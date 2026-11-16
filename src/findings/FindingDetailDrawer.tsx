import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  ArrowUpRight,
  AlertOctagon,
  CheckCircle2,
  ShieldCheck,
  Code,
  FileText,
} from 'lucide-react'
import type { EnrichedFinding, FindingStatus } from '../types/schema'
import Button from '../ui/Button'

interface FindingDetailDrawerProps {
  finding: EnrichedFinding | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus?: (id: string, status: FindingStatus) => void
}

export default function FindingDetailDrawer({
  finding,
  isOpen,
  onClose,
  onUpdateStatus,
}: FindingDetailDrawerProps) {
  const navigate = useNavigate()
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'request' | 'response'>('request')

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !finding) return null

  const severityColor =
    finding.severity === 'critical'
      ? 'text-status-red'
      : finding.severity === 'high'
      ? 'text-status-orange'
      : finding.severity === 'medium'
      ? 'text-status-yellow'
      : 'text-status-blue'

  const severityLabel =
    finding.severity === 'critical'
      ? 'Critical Severity'
      : finding.severity === 'high'
      ? 'High Severity'
      : finding.severity === 'medium'
      ? 'Medium Severity'
      : 'Low Severity'

  const statusLabel =
    finding.status === 'open'
      ? 'Open'
      : finding.status === 'confirmed'
      ? 'Confirmed'
      : finding.status === 'resolved'
      ? 'Resolved'
      : 'Accepted (FP)'

  const formattedDiscoveredDate = finding.discoveredAt
    ? new Date(finding.discoveredAt).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Unknown'

  const isBreached = typeof finding.slaDaysRemaining === 'number' && finding.slaDaysRemaining < 0
  const isOpenStatus = finding.status === 'open'
  const isResolved = finding.status === 'resolved'
  const isConfirmed = finding.status === 'confirmed'
  const isFalsePositive = finding.status === 'false_positive'

  return (
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
          aria-label="Finding Detail Drawer"
          className="w-screen max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Top Drawer Header */}
          <div className="p-6 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {/* Vulnerability Title */}
                <h2 className="text-h2 text-heading">
                  {finding.title}
                </h2>

                {/* Finding ID, Severity & Status */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                  <span className="font-mono font-semibold text-desc">
                    #{finding.id}
                  </span>
                  <span className={`font-semibold ${severityColor}`}>
                    {severityLabel}
                  </span>
                  <span className="text-desc font-medium">
                    {statusLabel}
                  </span>
                </div>

                {/* Target, Scan & Location Links */}
                <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                  <span className="font-mono text-desc flex items-center gap-1">
                    Target:{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/targets?targetId=${finding.targetId}`)
                      }}
                      className="text-status-blue font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                      title={`Open Target #${finding.targetId} (${finding.targetName})`}
                    >
                      <span>#{finding.targetId}</span>
                      <ArrowUpRight className="size-icon-xs shrink-0" />
                    </button>
                  </span>

                  <span className="font-mono text-desc flex items-center gap-1">
                    Scan:{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate(`/scans?scanId=${finding.scanId}`)
                      }}
                      className="text-status-blue font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                      title={`Open Scan #${finding.scanId}`}
                    >
                      <span>#{finding.scanId}</span>
                      <ArrowUpRight className="size-icon-xs shrink-0" />
                    </button>
                  </span>
                </div>

                {/* Target URL or Endpoint Location */}
                {finding.location && (
                  <div className="mt-2 text-xs font-mono text-heading font-medium truncate flex items-center gap-1.5">
                    <span className="text-desc">Endpoint:</span>
                    <span className="truncate">{finding.location}</span>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="size-icon-lg rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-md text-desc hover:text-heading" />
              </button>
            </div>

            {/* Quick Actions & SLA Bar */}
            <div className="flex items-center justify-between gap-3 mt-3.5 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={isOpenStatus ? 'primary' : 'secondary'}
                  size="sm"
                  selected={isOpenStatus}
                  onClick={() => onUpdateStatus?.(finding.id, 'open')}
                  className={!isOpenStatus ? 'border border-border' : ''}
                >
                  <span>Open</span>
                </Button>

                <Button
                  type="button"
                  variant={isConfirmed ? 'primary' : 'secondary'}
                  size="sm"
                  selected={isConfirmed}
                  onClick={() => onUpdateStatus?.(finding.id, 'confirmed')}
                  className={!isConfirmed ? 'border border-border' : ''}
                >
                  <AlertOctagon className={`size-icon-xs ${isConfirmed ? 'text-canvas' : 'text-status-orange'}`} />
                  <span>Confirmed</span>
                </Button>

                <Button
                  type="button"
                  variant={isResolved ? 'primary' : 'secondary'}
                  size="sm"
                  selected={isResolved}
                  onClick={() => onUpdateStatus?.(finding.id, 'resolved')}
                  className={!isResolved ? 'border border-border' : ''}
                >
                  <CheckCircle2 className={`size-icon-xs ${isResolved ? 'text-canvas' : 'text-desc'}`} />
                  <span>Resolved</span>
                </Button>

                <Button
                  type="button"
                  variant={isFalsePositive ? 'primary' : 'secondary'}
                  size="sm"
                  selected={isFalsePositive}
                  onClick={() => onUpdateStatus?.(finding.id, 'false_positive')}
                  className={!isFalsePositive ? 'border border-border' : ''}
                >
                  <span>Accepted (FP)</span>
                </Button>
              </div>

              {/* SLA & Discovered Date */}
              <div className="text-xs text-desc font-mono flex items-center gap-2.5">
                <span>Discovered {formattedDiscoveredDate}</span>
                {typeof finding.slaDaysRemaining === 'number' && (
                  <span className={isBreached ? 'text-status-red font-semibold' : 'text-desc'}>
                    {isBreached
                      ? `${Math.abs(finding.slaDaysRemaining)}d Breached`
                      : `${finding.slaDaysRemaining}d SLA`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Vulnerability Metadata Overview (Clean Text Grid, No Cards) */}
            <div>
              <h3 className="text-xs font-semibold text-heading mb-2.5">
                Vulnerability Overview
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-desc text-[11px]">CWE Definition</div>
                  <div className="font-mono text-xs font-semibold text-heading mt-1">
                    {finding.cwe || 'N/A'}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Category</div>
                  <div className="text-xs font-semibold text-heading mt-1">
                    {finding.category || 'OWASP Top 10'}
                  </div>
                </div>

                <div>
                  <div className="text-desc text-[11px]">Remediation Complexity</div>
                  <div className="text-xs font-semibold text-heading mt-1 capitalize">
                    {finding.complexity || 'Medium'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Vulnerability Description */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="size-icon-xs text-caption" />
                <h3 className="text-xs font-semibold text-heading">
                  Vulnerability Description
                </h3>
              </div>
              <p className="text-xs text-body leading-relaxed select-text">
                {finding.description ||
                  'During automated dynamic security analysis, the scanner discovered security flaws on this endpoint that violate standard secure development benchmarks.'}
              </p>
            </div>

            {/* 3. Remediation & Fix Guidance */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="size-icon-xs text-caption" />
                <h3 className="text-xs font-semibold text-heading">
                  Remediation Guidance
                </h3>
              </div>
              <p className="text-xs text-body leading-relaxed select-text font-mono">
                {finding.remediation ||
                  'Implement robust input validation, boundary sanitization, and output encoding. Consult OWASP cheat sheets for verified remediation practices.'}
              </p>
            </div>

            {/* 4. HTTP Evidence (Request & Response) - Dynamic Height Container */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Code className="size-icon-xs text-caption" />
                  <h3 className="text-xs font-semibold text-heading">
                    HTTP Evidence
                  </h3>
                </div>

                {/* Request / Response Switcher Tabs */}
                <div className="inline-flex rounded-lg border border-border divide-x divide-border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveEvidenceTab('request')}
                    className={`px-3 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer ${
                      activeEvidenceTab === 'request'
                        ? 'bg-surface text-heading font-semibold'
                        : 'bg-card text-desc hover:text-heading hover:bg-surface/50'
                    }`}
                  >
                    Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveEvidenceTab('response')}
                    className={`px-3 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer ${
                      activeEvidenceTab === 'response'
                        ? 'bg-surface text-heading font-semibold'
                        : 'bg-card text-desc hover:text-heading hover:bg-surface/50'
                    }`}
                  >
                    Response
                  </button>
                </div>
              </div>

              {/* Code Evidence Terminal Box */}
              <div className="bg-canvas rounded-xl p-4 font-mono text-xs text-body leading-relaxed overflow-y-auto max-h-drawer-log border border-border select-text">
                <pre className="whitespace-pre-wrap break-all">
                  {activeEvidenceTab === 'request'
                    ? finding.evidence?.request ||
                      `${finding.location} HTTP/1.1\nHost: target-host\nUser-Agent: Antigravity-Scanner/2.0\nAccept: */*\n\n[Sample Request Payload]`
                    : finding.evidence?.response ||
                      `HTTP/1.1 200 OK\nContent-Type: application/json\nServer: nginx/1.24.0\n\n[Sample Response Payload]`}
                </pre>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
