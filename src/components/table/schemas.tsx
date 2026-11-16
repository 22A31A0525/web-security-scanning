import type { DataTableColumn } from './types'
import type { Target, Scan, Finding, Report } from '../../types/schema'
import { Lock, Unlock } from 'lucide-react'

/**
 * 1. Web & API Targets Column Schema
 */
export const targetTableColumns: DataTableColumn<Target>[] = [
  {
    id: 'id',
    header: 'ID',
    width: '100px',
    sortable: true,
    cell: (target) => (
      <span className="font-mono text-desc font-medium">#{target.id}</span>
    ),
  },
  {
    id: 'name',
    header: 'Asset & Endpoint',
    sortable: true,
    cell: (target) => (
      <div className="flex flex-col min-w-0">
        <span className="text-heading font-semibold truncate">{target.name}</span>
        <span className="text-caption font-mono text-[11px] truncate mt-0.5">{target.url}</span>
      </div>
    ),
  },
  {
    id: 'environment',
    header: 'Environment',
    width: '130px',
    sortable: true,
    cell: (target) => {
      const envColors: Record<string, string> = {
        production: 'bg-status-red/15 text-status-red border-status-red/30',
        staging: 'bg-status-orange/15 text-status-orange border-status-orange/30',
        dev: 'bg-status-blue/15 text-status-blue border-status-blue/30',
      }
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
            envColors[target.environment] || 'bg-surface text-desc border-border'
          }`}
        >
          {target.environment}
        </span>
      )
    },
  },
  {
    id: 'authenticated',
    header: 'Auth Scope',
    width: '140px',
    sortable: true,
    cell: (target) => (
      <div className="flex items-center gap-1.5 text-xs text-desc">
        {target.authenticated ? (
          <>
            <Lock className="size-icon-xs text-scope-authenticated shrink-0" />
            <span className="text-body font-medium">Authenticated</span>
          </>
        ) : (
          <>
            <Unlock className="size-icon-xs text-scope-unauthenticated shrink-0" />
            <span className="text-caption">Unauthenticated</span>
          </>
        )}
      </div>
    ),
  },
  {
    id: 'riskScore',
    header: 'Risk Grade',
    width: '135px',
    align: 'center',
    sortable: true,
    cell: (target) => {
      const score = target.riskScore || 'A'
      const gradeColor =
        score === 'A'
          ? 'text-status-green'
          : score === 'B'
          ? 'text-status-blue'
          : score === 'C'
          ? 'text-status-yellow'
          : 'text-status-red'
      return (
        <span className={`font-bold text-xs ${gradeColor}`}>
          {score}
        </span>
      )
    },
  },
  {
    id: 'openFindings',
    header: 'Active Findings',
    width: '130px',
    align: 'center',
    sortable: true,
    cell: (target) => (
      <span className="font-semibold text-heading font-mono">
        {target.openFindings} open
      </span>
    ),
  },
  {
    id: 'lastScannedAt',
    header: 'Last Audit',
    width: '160px',
    sortable: true,
    cell: (target) => (
      <span className="text-desc font-mono text-[11px]">
        {new Date(target.lastScannedAt).toLocaleDateString()}
      </span>
    ),
  },
]

/**
 * 2. Scan Execution History Column Schema
 */
export const scanTableColumns: DataTableColumn<Scan>[] = [
  {
    id: 'id',
    header: 'ID',
    width: '100px',
    sortable: true,
    cell: (scan) => (
      <span className="font-mono text-desc font-medium">#{scan.id}</span>
    ),
  },
  {
    id: 'targetId',
    header: 'Target Asset',
    sortable: true,
    cell: (scan) => (
      <span className="font-semibold text-heading font-mono text-xs">{scan.targetId}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    width: '110px',
    sortable: true,
    cell: (scan) => {
      let dot = 'bg-status-green'
      let label = 'Completed'
      if (scan.status === 'running') {
        dot = 'bg-status-blue'
        label = scan.progress > 50 ? 'Auditing' : 'Crawling'
      } else if (scan.status === 'queued') {
        dot = 'bg-status-yellow'
        label = 'Queued'
      } else if (scan.status === 'failed') {
        dot = 'bg-status-red'
        label = 'Failed'
      }
      return (
        <div className="flex items-center gap-1.5 text-xs text-desc">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
          <span>{label}</span>
        </div>
      )
    },
  },
  {
    id: 'progress',
    header: 'Progress',
    width: '140px',
    cell: (scan) => (
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 bg-surface h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-heading h-full rounded-full transition-all"
            style={{ width: `${scan.progress}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-desc">{scan.progress}%</span>
      </div>
    ),
  },
  {
    id: 'findingsCount',
    header: 'Findings',
    width: '180px',
    cell: (scan) => (
      <div className="grid grid-cols-3 gap-1 text-xs text-desc whitespace-nowrap">
        <span>{scan.findingsCount.critical || 0} crit</span>
        <span>{scan.findingsCount.high || 0} high</span>
        <span>{scan.findingsCount.medium || 0} med</span>
      </div>
    ),
  },
  {
    id: 'durationSec',
    header: 'Duration',
    width: '110px',
    sortable: true,
    cell: (scan) => {
      const min = Math.floor(scan.durationSec / 60)
      const sec = scan.durationSec % 60
      return (
        <span className="font-mono text-desc text-xs">
          {min}m {String(sec).padStart(2, '0')}s
        </span>
      )
    },
  },
  {
    id: 'startedAt',
    header: 'Triggered At',
    width: '160px',
    sortable: true,
    cell: (scan) => (
      <span className="text-desc font-mono text-[11px]">
        {new Date(scan.startedAt).toLocaleDateString()}
      </span>
    ),
  },
]

/**
 * 3. Vulnerability Findings Column Schema
 */
export const findingTableColumns: DataTableColumn<Finding>[] = [
  {
    id: 'id',
    header: 'ID',
    width: '100px',
    sortable: true,
    cell: (finding) => (
      <span className="font-mono text-desc font-medium">#{finding.id}</span>
    ),
  },
  {
    id: 'severity',
    header: 'Severity',
    width: '120px',
    sortable: true,
    cell: (finding) => {
      const colors = {
        critical: 'bg-status-red/15 text-status-red border-status-red/30',
        high: 'bg-status-orange/15 text-status-orange border-status-orange/30',
        medium: 'bg-status-yellow/15 text-status-yellow border-status-yellow/30',
        low: 'bg-status-blue/15 text-status-blue border-status-blue/30',
        info: 'bg-surface text-desc border-border',
      }
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
            colors[finding.severity]
          }`}
        >
          {finding.severity}
        </span>
      )
    },
  },
  {
    id: 'title',
    header: 'Vulnerability Title & Path',
    sortable: true,
    cell: (finding) => (
      <div className="flex flex-col min-w-0">
        <span className="text-heading font-semibold truncate">{finding.title}</span>
        <span className="text-caption font-mono text-[11px] truncate mt-0.5">{finding.location}</span>
      </div>
    ),
  },
  {
    id: 'category',
    header: 'OWASP Category',
    width: '220px',
    sortable: true,
    cell: (finding) => (
      <span className="text-desc truncate block max-w-[200px]" title={finding.category}>
        {finding.category}
      </span>
    ),
  },
  {
    id: 'cwe',
    header: 'CWE ID',
    width: '110px',
    sortable: true,
    cell: (finding) => (
      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface border border-border text-desc">
        {finding.cwe}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Triage Status',
    width: '130px',
    sortable: true,
    cell: (finding) => {
      const statusLabels: Record<string, { label: string; cls: string }> = {
        open: { label: 'Open', cls: 'text-status-red' },
        confirmed: { label: 'Confirmed', cls: 'text-status-orange' },
        resolved: { label: 'Resolved', cls: 'text-status-green' },
        false_positive: { label: 'Accepted (FP)', cls: 'text-caption' },
      }
      const s = statusLabels[finding.status] || { label: finding.status, cls: 'text-desc' }
      return <span className={`font-semibold text-xs ${s.cls}`}>{s.label}</span>
    },
  },
  {
    id: 'slaDaysRemaining',
    header: 'SLA Window',
    width: '120px',
    sortable: true,
    cell: (finding) => {
      if (finding.status === 'resolved') {
        return <span className="text-status-green text-[11px] font-medium">Met SLA</span>
      }
      const days = finding.slaDaysRemaining ?? 0
      const isBreached = days <= 0
      return (
        <span
          className={`font-mono text-[11px] font-semibold ${
            isBreached ? 'text-status-red' : days <= 3 ? 'text-status-yellow' : 'text-desc'
          }`}
        >
          {isBreached ? 'Breached (0d)' : `${days}d left`}
        </span>
      )
    },
  },
]

/**
 * 4. Compliance & Audit Reports Column Schema
 */
export const reportTableColumns: DataTableColumn<Report>[] = [
  {
    id: 'id',
    header: 'ID',
    width: '100px',
    sortable: true,
    cell: (report) => (
      <span className="font-mono text-desc font-medium">#{report.id}</span>
    ),
  },
  {
    id: 'title',
    header: 'Report Title & Target',
    sortable: true,
    cell: (report) => (
      <div className="flex flex-col min-w-0">
        <span className="text-heading font-semibold truncate">
          {report.title || `${report.target} Evaluation`}
        </span>
        <span className="text-caption text-[11px] truncate mt-0.5">{report.target}</span>
      </div>
    ),
  },
  {
    id: 'framework',
    header: 'Compliance Framework',
    width: '200px',
    sortable: true,
    cell: (report) => (
      <span className="text-desc font-medium truncate block">
        {report.framework || 'OWASP Top 10 Audit'}
      </span>
    ),
  },
  {
    id: 'findings',
    header: 'Findings Covered',
    width: '140px',
    align: 'center',
    sortable: true,
    cell: (report) => (
      <span className="font-mono font-semibold text-heading">
        {report.findings} findings
      </span>
    ),
  },
  {
    id: 'format',
    header: 'Format',
    width: '100px',
    align: 'center',
    cell: (report) => (
      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface border border-border text-desc">
        {report.format}
      </span>
    ),
  },
  {
    id: 'createdAt',
    header: 'Generated Date',
    width: '160px',
    sortable: true,
    cell: (report) => (
      <span className="text-desc font-mono text-[11px]">
        {new Date(report.createdAt).toLocaleDateString()}
      </span>
    ),
  },
]
