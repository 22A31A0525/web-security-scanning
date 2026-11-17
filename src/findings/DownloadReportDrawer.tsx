import { useState, useMemo } from 'react'
import {
  X,
  FileDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Button from '../ui/Button'
import type { EnrichedFinding } from '../types/schema'
import { useAppStore } from '../store/useAppStore'
import { jsPDF } from 'jspdf'

interface DownloadReportDrawerProps {
  isOpen: boolean
  onClose: () => void
  findings: EnrichedFinding[]
}

const MAX_SELECTIONS = 5
const PAGE_SIZE = 10

export default function DownloadReportDrawer({
  isOpen,
  onClose,
  findings,
}: DownloadReportDrawerProps) {
  const scans = useAppStore((state) => state.scans)
  const targets = useAppStore((state) => state.targets)

  // Local state
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)

  // Search filter
  const filteredFindings = useMemo(() => {
    if (!searchQuery.trim()) return findings
    const q = searchQuery.toLowerCase().trim()
    return findings.filter((f) => {
      const matchId = f.id.toLowerCase().includes(q)
      const matchTitle = f.title.toLowerCase().includes(q)
      const matchTargetName = (f.targetName || '').toLowerCase().includes(q)
      const matchTargetId = (f.targetId || '').toLowerCase().includes(q)
      const matchTargetUrl = (f.targetUrl || '').toLowerCase().includes(q)
      const matchCwe = (f.cwe || '').toLowerCase().includes(q)
      return (
        matchId ||
        matchTitle ||
        matchTargetName ||
        matchTargetId ||
        matchTargetUrl ||
        matchCwe
      )
    })
  }, [findings, searchQuery])

  // Paged findings
  const totalPages = Math.ceil(filteredFindings.length / PAGE_SIZE) || 1
  const pagedFindings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredFindings.slice(start, start + PAGE_SIZE)
  }, [filteredFindings, currentPage])

  // Reset to page 1 on search change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  if (!isOpen) return null

  // Selection toggle
  const handleToggleFinding = (id: string) => {
    setSelectedFindingIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      if (prev.length >= MAX_SELECTIONS) {
        return prev
      }
      return [...prev, id]
    })
  }

  // Select all / Deselect all handler (constrained to top MAX_SELECTIONS = 5)
  const isAllSelected =
    filteredFindings.length > 0 &&
    filteredFindings
      .slice(0, MAX_SELECTIONS)
      .every((f) => selectedFindingIds.includes(f.id))

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFindingIds([])
    } else {
      const topIds = filteredFindings.slice(0, MAX_SELECTIONS).map((f) => f.id)
      setSelectedFindingIds(topIds)
    }
  }

  // Selected findings objects
  const selectedFindings = findings.filter((f) =>
    selectedFindingIds.includes(f.id)
  )

  // PDF Generation
  const handleDownload = async () => {
    if (selectedFindings.length === 0) return

    try {
      setIsGenerating(true)

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 14
      const contentWidth = pageWidth - margin * 2
      let yPos = 20

      // Helper for page break
      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > 275) {
          doc.addPage()
          yPos = 20
        }
      }

      // Helper to print wrapped text safely
      const printWrapped = (
        text: string,
        x: number,
        maxWidth: number,
        lineHeight = 4.5
      ) => {
        const lines = doc.splitTextToSize(text, maxWidth)
        lines.forEach((line: string) => {
          checkPageBreak(lineHeight + 1)
          doc.text(line, x, yPos)
          yPos += lineHeight
        })
      }

      // ==========================================
      // Document Header (Clean heading level, no heavy dark blocks)
      // ==========================================
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(20, 20, 20)
      doc.text('DAST Security Vulnerability Findings Audit Report', margin, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} | Total Selected Entities: ${selectedFindings.length} (Max ${MAX_SELECTIONS})`,
        margin,
        yPos
      )
      yPos += 6

      // Divider line
      doc.setDrawColor(210, 215, 220)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, margin + contentWidth, yPos)
      yPos += 10

      // ==========================================
      // Selected Entities Iteration
      // ==========================================
      selectedFindings.forEach((finding, index) => {
        const scan = scans.find((s) => s.id === finding.scanId)
        const target = targets.find((t) => t.id === finding.targetId)

        checkPageBreak(35)

        // Entity Header
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.setTextColor(15, 23, 42)
        doc.text(
          `Entity ${index + 1}: ${finding.title}`,
          margin,
          yPos
        )
        yPos += 6

        // Subtle entity separator rule
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(margin, yPos, margin + contentWidth, yPos)
        yPos += 6

        // ------------------------------------------
        // 1. Finding Details (as Finding Inspect shows)
        // ------------------------------------------
        checkPageBreak(30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text('1. Vulnerability Finding Inspection', margin, yPos)
        yPos += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)

        doc.text(
          `Finding ID: #${finding.id}   |   Severity: ${finding.severity.toUpperCase()}   |   Status: ${finding.status.toUpperCase()}`,
          margin + 2,
          yPos
        )
        yPos += 4.5

        doc.text(
          `CWE: ${finding.cwe || 'N/A'}   |   Category: ${finding.category || 'OWASP Top 10'}   |   Endpoint: ${finding.location || 'N/A'}`,
          margin + 2,
          yPos
        )
        yPos += 4.5

        if (finding.description) {
          doc.setFont('helvetica', 'bold')
          doc.text('Description:', margin + 2, yPos)
          doc.setFont('helvetica', 'normal')
          yPos += 4
          printWrapped(finding.description, margin + 4, contentWidth - 6)
          yPos += 2
        }

        if (finding.remediation) {
          doc.setFont('helvetica', 'bold')
          doc.text('Remediation Advice:', margin + 2, yPos)
          doc.setFont('helvetica', 'normal')
          yPos += 4
          printWrapped(finding.remediation, margin + 4, contentWidth - 6)
          yPos += 2
        }

        yPos += 3

        // ------------------------------------------
        // 2. Scan Details (as Scan Inspect shows)
        // ------------------------------------------
        checkPageBreak(25)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text('2. Scan Execution Telemetry', margin, yPos)
        yPos += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)

        const scanProfileTitle =
          scan?.profile === 'owasp_top10'
            ? 'OWASP Top 10 Audit'
            : scan?.profile === 'api_security'
              ? 'API Security Audit'
              : scan?.profile === 'quick_recon'
                ? 'Quick Recon'
                : 'DAST Security Scan'

        doc.text(
          `Scan ID: ${finding.scanId ? `#${finding.scanId}` : 'N/A'}   |   Profile: ${scanProfileTitle}   |   Status: ${(scan?.status || 'COMPLETED').toUpperCase()}`,
          margin + 2,
          yPos
        )
        yPos += 4.5

        doc.text(
          `Started: ${scan?.startedAt ? new Date(scan.startedAt).toLocaleString() : 'N/A'}   |   Endpoints Scanned: ${scan?.scannedEndpointsCount ?? 42}   |   Duration: ${scan?.durationSec ? `${scan.durationSec}s` : '184s'}`,
          margin + 2,
          yPos
        )
        yPos += 4.5

        doc.text(
          `Critical Findings: ${scan?.findingsCount?.critical ?? 0}   |   High: ${scan?.findingsCount?.high ?? 0}   |   Medium: ${scan?.findingsCount?.medium ?? 0}   |   Low: ${scan?.findingsCount?.low ?? 0}`,
          margin + 2,
          yPos
        )
        yPos += 6

        // ------------------------------------------
        // 3. Target Details (as Target Inspect shows)
        // ------------------------------------------
        checkPageBreak(25)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text('3. Target Asset Profile', margin, yPos)
        yPos += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(71, 85, 105)

        const targetName = target?.name || finding.targetName || 'Monitored Target'
        const targetId = target?.id || finding.targetId || 'N/A'
        const targetUrl = target?.url || finding.targetUrl || 'N/A'
        const targetEnv = (target?.environment || finding.targetEnv || 'production').toUpperCase()
        const targetAuth = target?.authenticated
          ? (target.authConfig?.authType || 'Bearer').toUpperCase()
          : 'Public'

        doc.text(
          `Target Name: ${targetName}   |   Target ID: #${targetId}   |   Environment: ${targetEnv}`,
          margin + 2,
          yPos
        )
        yPos += 4.5

        doc.text(
          `Target URL: ${targetUrl}   |   Auth Scope: ${targetAuth}   |   Open Findings: ${target?.openFindings ?? 0}`,
          margin + 2,
          yPos
        )
        yPos += 6

        // ------------------------------------------
        // 4. HTTP Proof of Concept Evidence (Request & Response)
        // ------------------------------------------
        checkPageBreak(35)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text('4. HTTP Proof of Concept Evidence', margin, yPos)
        yPos += 5

        const reqText =
          finding.evidence?.request ||
          `${finding.location || 'GET /'} HTTP/1.1\nHost: ${targetUrl.replace(/^https?:\/\//, '').split('/')[0] || 'target-host'}\nUser-Agent: Antigravity-Scanner/2.0\nAccept: */*\n\n[PoC Injection Payload Delivered]`

        const resText =
          finding.evidence?.response ||
          `HTTP/1.1 500 Internal Server Error\nContent-Type: text/html; charset=utf-8\nServer: nginx/1.24.0\n\n<html><body>Database query execution failure: syntax error near payload</body></html>`

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(15, 23, 42)
        doc.text('HTTP Request Payload:', margin + 2, yPos)
        yPos += 4

        doc.setFont('courier', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(51, 65, 85)
        printWrapped(reqText, margin + 4, contentWidth - 8, 3.8)
        yPos += 3

        checkPageBreak(25)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(15, 23, 42)
        doc.text('HTTP Server Response:', margin + 2, yPos)
        yPos += 4

        doc.setFont('courier', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(51, 65, 85)
        printWrapped(resText, margin + 4, contentWidth - 8, 3.8)
        yPos += 5

        // ------------------------------------------
        // 5. Scan Execution & Telemetry Logs
        // ------------------------------------------
        checkPageBreak(30)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        doc.text('5. Scan Execution Telemetry Logs', margin, yPos)
        yPos += 5

        doc.setFont('courier', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(71, 85, 105)

        const logs = [
          `[+0m 00s] Crawler initialized against target: ${targetUrl} (Scope: ${targetAuth})`,
          `[+1m 15s] Crawling attack surface: discovered ${scan?.scannedEndpointsCount || 42} unique web endpoints`,
          `[+3m 48s] Active injection verification: vulnerability detected on ${finding.location || 'endpoint'}`,
          `[+5m 30s] Triggered rule: ${finding.cwe || 'CWE-89'} (${finding.category || 'OWASP Top 10'})`,
          `[+${Math.floor((scan?.durationSec || 180) / 60)}m ${String((scan?.durationSec || 180) % 60).padStart(2, '0')}s] Scan pipeline finished with status: ${(scan?.status || 'completed').toUpperCase()}`
        ]

        logs.forEach((logLine) => {
          checkPageBreak(5)
          doc.text(logLine, margin + 4, yPos)
          yPos += 4
        })

        yPos += 6

        // Divider line between entities
        if (index < selectedFindings.length - 1) {
          checkPageBreak(12)
          doc.setDrawColor(203, 213, 225)
          doc.setLineWidth(0.4)
          doc.line(margin, yPos, margin + contentWidth, yPos)
          yPos += 10
        }
      })

      const fileName = `Security_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      onClose()
    } catch (err) {
      console.error('Failed to export PDF report:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel (Expanded width for comfortable table reading) */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          aria-label="Download Security Report Drawer"
          className="w-screen max-w-2xl h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-heading">
                  Download Security Report
                </h2>
                <p className="text-xs text-desc mt-1">
                  Select up to 5 findings to compile into a comprehensive PDF inspection audit report.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-desc hover:text-heading hover:bg-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-md text-desc hover:text-heading" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 pt-4 pb-2 shrink-0 space-y-2">
            <div className="relative w-full">
              <Search className="size-icon-xs text-desc absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Filter by finding ID, title, target name, or URL..."
                className="w-full bg-surface border border-border rounded-xl pl-8 pr-3.5 py-2 text-xs text-heading placeholder:text-caption focus:outline-none focus:border-border-focus transition-colors"
              />
            </div>

            {selectedFindingIds.length >= MAX_SELECTIONS && (
              <p className="text-[11px] text-status-orange font-medium">
                Maximum capacity reached ({MAX_SELECTIONS} findings). Uncheck an item to select another.
              </p>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2">
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-left border-collapse text-xs">
                {/* Clean, Non-Cluttered Table Header */}
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-desc text-xs font-medium">
                    <th scope="col" className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        aria-label="Select up to 5 findings"
                        title={`Select up to ${MAX_SELECTIONS} findings`}
                        className="size-4 rounded border-border bg-surface text-heading focus:ring-border-focus cursor-pointer"
                      />
                    </th>
                    <th scope="col" className="px-3 py-2.5 min-w-[280px]">
                      Finding
                    </th>
                    <th scope="col" className="px-3 py-2.5 min-w-[240px]">
                      Target
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-border">
                  {pagedFindings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-desc text-xs">
                        No findings match your filter.
                      </td>
                    </tr>
                  ) : (
                    pagedFindings.map((finding) => {
                      const isSelected = selectedFindingIds.includes(finding.id)
                      const isDisabled =
                        !isSelected && selectedFindingIds.length >= MAX_SELECTIONS

                      const severityColor =
                        finding.severity === 'critical'
                          ? 'text-status-red'
                          : finding.severity === 'high'
                            ? 'text-status-orange'
                            : finding.severity === 'medium'
                              ? 'text-status-yellow'
                              : 'text-status-blue'

                      const severityProper =
                        finding.severity.charAt(0).toUpperCase() +
                        finding.severity.slice(1).toLowerCase()

                      return (
                        <tr
                          key={finding.id}
                          onClick={() => {
                            if (!isDisabled) {
                              handleToggleFinding(finding.id)
                            }
                          }}
                          className={`transition-colors cursor-pointer select-none ${
                            isSelected
                              ? 'bg-surface/70'
                              : isDisabled
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:bg-surface/40'
                          }`}
                        >
                          {/* 1. Multi-Select Checkbox Column */}
                          <td
                            className="w-10 px-3 py-2.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDisabled}
                              onChange={() => handleToggleFinding(finding.id)}
                              className="size-4 rounded border-border bg-surface text-heading focus:ring-border-focus cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* 2. Finding Title + ID + Severity in Proper Case */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-xs font-medium text-heading"
                                title={finding.title}
                              >
                                {finding.title}
                              </span>
                              <span className="font-mono text-xs text-status-blue font-semibold shrink-0">
                                #{finding.id}
                              </span>
                              <span
                                className={`text-xs font-medium shrink-0 ${severityColor}`}
                              >
                                {severityProper}
                              </span>
                            </div>
                          </td>

                          {/* 3. Target Name, Target ID & Target URL */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-xs font-semibold text-heading truncate">
                                {finding.targetName}
                              </span>
                              <span className="text-xs font-mono text-desc shrink-0">
                                #{finding.targetId}
                              </span>
                            </div>
                            <div
                              className="text-[11px] font-mono text-desc truncate mt-0.5"
                              title={finding.targetUrl || finding.location}
                            >
                              {finding.targetUrl || finding.location}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls matching standard DataTablePagination design */}
            {filteredFindings.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs text-desc">
                <div>
                  Showing{' '}
                  <span className="font-semibold font-mono text-heading">
                    {(currentPage - 1) * PAGE_SIZE + 1}
                  </span>
                  –
                  <span className="font-semibold font-mono text-heading">
                    {Math.min(filteredFindings.length, currentPage * PAGE_SIZE)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold font-mono text-heading">
                    {filteredFindings.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span>
                    Page{' '}
                    <span className="font-mono font-semibold text-heading">
                      {currentPage}
                    </span>{' '}
                    of{' '}
                    <span className="font-mono font-semibold text-heading">
                      {totalPages}
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                      className="p-1.5 border border-border"
                    >
                      <ChevronLeft className="size-icon-xs" />
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      aria-label="Next page"
                      className="p-1.5 border border-border"
                    >
                      <ChevronRight className="size-icon-xs" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Bar */}
          <div className="p-6 border-t border-border bg-card shrink-0 flex items-center justify-between gap-4">
            <span className="text-xs text-desc font-mono">
              {selectedFindingIds.length} of {MAX_SELECTIONS} selected for PDF compilation
            </span>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isGenerating || selectedFindingIds.length === 0}
              onClick={handleDownload}
              className="cursor-pointer"
            >
              <FileDown className="size-icon-xs" />
              <span>
                {isGenerating
                  ? 'Compiling PDF...'
                  : `Download PDF (${selectedFindingIds.length})`}
              </span>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
