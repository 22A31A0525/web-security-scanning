import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  FileDown,
  Download,
  Calendar,
  Layers,
  Activity,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import Button from '../ui/Button'
import type { EnrichedReport } from '../types/schema'
import { useAppStore } from '../store/useAppStore'
import { jsPDF } from 'jspdf'

interface ReportDetailDrawerProps {
  report: EnrichedReport | null
  isOpen: boolean
  onClose: () => void
}

export default function ReportDetailDrawer({
  report,
  isOpen,
  onClose,
}: ReportDetailDrawerProps) {
  const scans = useAppStore((state) => state.scans)
  const targets = useAppStore((state) => state.targets)
  const findings = useAppStore((state) => state.findings)

  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

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

  // Get associated scan and findings for this report
  const associatedScan = useMemo(() => {
    if (!report) return null
    return scans.find((s) => s.id === report.scanId) || null
  }, [report, scans])

  const associatedFindings = useMemo(() => {
    if (!report) return []
    if (report.findingIds && report.findingIds.length > 0) {
      return findings.filter((f) => report.findingIds?.includes(f.id))
    }
    return findings.filter((f) => f.scanId === report.scanId).slice(0, 5)
  }, [report, findings])

  // Generate live PDF blob URL when report opens
  useEffect(() => {
    if (!isOpen || !report) {
      setPdfDataUrl(null)
      return
    }

    let active = true
    setIsGenerating(true)

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 14
      const contentWidth = pageWidth - margin * 2
      let yPos = 20

      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > 275) {
          doc.addPage()
          yPos = 20
        }
      }

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
      // Header Section
      // ==========================================
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.setTextColor(15, 23, 42)
      doc.text(report.title || 'Security Evaluation Audit Report', margin, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 116, 139)
      doc.text(
        `Report ID: #${report.id}   |   Framework: ${report.framework || 'OWASP Top 10 Audit'}   |   Target: ${report.target}`,
        margin,
        yPos
      )
      yPos += 4.5
      doc.text(
        `Scan ID: #${report.scanId}   |   Date: ${new Date(report.createdAt).toLocaleDateString()}   |   Total Included Findings: ${associatedFindings.length}`,
        margin,
        yPos
      )
      yPos += 6

      // Divider line
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.5)
      doc.line(margin, yPos, margin + contentWidth, yPos)
      yPos += 9

      // ==========================================
      // Associated Findings Loop
      // ==========================================
      associatedFindings.forEach((finding, index) => {
        const target = targets.find((t) => t.id === finding.targetId)
        const scan = scans.find((s) => s.id === finding.scanId)

        checkPageBreak(30)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(15, 23, 42)
        doc.text(`Entity ${index + 1}: ${finding.title}`, margin, yPos)
        yPos += 5.5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(71, 85, 105)
        doc.text(
          `Finding ID: #${finding.id}   |   Severity: ${finding.severity.toUpperCase()}   |   CWE: ${finding.cwe || 'N/A'}   |   Status: ${finding.status.toUpperCase()}`,
          margin + 2,
          yPos
        )
        yPos += 4

        doc.text(
          `Endpoint: ${finding.location || 'N/A'}   |   Target: ${target?.name || finding.targetName || report.target} (#${finding.targetId})`,
          margin + 2,
          yPos
        )
        yPos += 4.5

        if (finding.description) {
          doc.setFont('helvetica', 'bold')
          doc.text('Description:', margin + 2, yPos)
          doc.setFont('helvetica', 'normal')
          yPos += 3.5
          printWrapped(finding.description, margin + 4, contentWidth - 6, 4)
          yPos += 2
        }

        if (finding.remediation) {
          doc.setFont('helvetica', 'bold')
          doc.text('Remediation Advice:', margin + 2, yPos)
          doc.setFont('helvetica', 'normal')
          yPos += 3.5
          printWrapped(finding.remediation, margin + 4, contentWidth - 6, 4)
          yPos += 2
        }

        // Scan details
        checkPageBreak(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Scan Execution Context:', margin + 2, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 3.5
        doc.text(
          `Scan ID: #${finding.scanId}   |   Endpoints: ${scan?.scannedEndpointsCount || 42}   |   Duration: ${scan?.durationSec || 180}s`,
          margin + 4,
          yPos
        )
        yPos += 4.5

        // HTTP Proof of Concept
        checkPageBreak(25)
        doc.setFont('helvetica', 'bold')
        doc.text('HTTP Proof of Concept Evidence:', margin + 2, yPos)
        yPos += 3.5

        const reqText =
          finding.evidence?.request ||
          `${finding.location || 'GET /'} HTTP/1.1\nHost: ${(target?.url || 'target.acme.com').replace(/^https?:\/\//, '')}\nAccept: */*`
        doc.setFont('courier', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(51, 65, 85)
        printWrapped(reqText, margin + 4, contentWidth - 6, 3.5)
        yPos += 4

        if (index < associatedFindings.length - 1) {
          checkPageBreak(8)
          doc.setDrawColor(226, 232, 240)
          doc.setLineWidth(0.3)
          doc.line(margin, yPos, margin + contentWidth, yPos)
          yPos += 7
        }
      })

      // Convert to blob URL for iframe preview
      const pdfBlob = doc.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)
      if (active) {
        setPdfDataUrl(blobUrl)
      }
    } catch (err) {
      console.error('Failed to generate preview PDF:', err)
    } finally {
      if (active) setIsGenerating(false)
    }

    return () => {
      active = false
    }
  }, [isOpen, report, associatedFindings, scans, targets])

  if (!isOpen || !report) return null

  const handleDownload = () => {
    if (!pdfDataUrl) return
    const a = document.createElement('a')
    a.href = pdfDataUrl
    a.download = `${report.id}_evaluation_report.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Report Preview #${report.id}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/70 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Sidebar Panel */}
      <div
        className={`absolute inset-y-0 right-0 max-w-full flex transition-all duration-200 ${
          isMaximized ? 'w-full pl-0' : 'pl-6 sm:pl-10'
        }`}
      >
        <aside
          className={`h-full bg-sidebar border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 transition-all ${
            isMaximized ? 'w-full' : 'w-screen max-w-3xl sm:max-w-4xl'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border bg-sidebar shrink-0 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-heading truncate">
                  {report.title}
                </h2>
                <span className="font-mono text-xs font-semibold text-status-blue shrink-0">
                  #{report.id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-desc mt-0.5">
                <span className="truncate">{report.target}</span>
                <span>•</span>
                <span>{report.framework || 'OWASP Top 10 Audit'}</span>
                <span>•</span>
                <span className="font-mono">{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-lg text-desc hover:text-heading hover:bg-surface transition-colors cursor-pointer"
                title={isMaximized ? 'Restore drawer width' : 'Maximize drawer'}
                aria-label={isMaximized ? 'Restore drawer width' : 'Maximize drawer'}
              >
                {isMaximized ? (
                  <Minimize2 className="size-icon-xs" />
                ) : (
                  <Maximize2 className="size-icon-xs" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-desc hover:text-heading hover:bg-surface transition-colors cursor-pointer"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="size-icon-xs" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Body */}
          <div className="flex-1 min-h-0 bg-card relative flex flex-col p-0">
            {isGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-desc">
                <Activity className="size-8 text-status-blue animate-pulse mb-3" />
                <p className="text-sm font-semibold text-heading">Rendering PDF Preview...</p>
                <p className="text-xs text-desc mt-1">
                  Compiling findings telemetry, scan execution logs, and HTTP evidence into preview.
                </p>
              </div>
            ) : pdfDataUrl ? (
              <div className="w-full h-full overflow-hidden bg-card flex flex-col">
                <iframe
                  src={`${pdfDataUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title={`PDF Preview for ${report.title}`}
                  className="w-full h-full border-0 bg-card"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-desc">
                <p className="text-sm text-heading">Failed to load PDF preview.</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-sidebar shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-desc">
              <span className="font-semibold text-heading font-mono">
                {associatedFindings.length}
              </span>
              <span>included findings compiled in this audit report</span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleDownload}
              disabled={!pdfDataUrl || isGenerating}
              className="cursor-pointer"
            >
              <Download className="size-icon-xs" />
              <span>Generate report</span>
            </Button>
          </div>
        </aside>
      </div>
    </div>,
    document.body
  )
}
