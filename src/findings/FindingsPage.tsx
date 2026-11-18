import { useState } from 'react'
import { Download } from 'lucide-react'
import Button from '../ui/Button'
import FindingsView from './FindingsView'
import DownloadReportDrawer from './DownloadReportDrawer'
import { useEnrichedFindings } from '../store/useAppStore'

export default function FindingsPage() {
  const [isDownloadDrawerOpen, setIsDownloadDrawerOpen] = useState(false)
  const findings = useEnrichedFindings()

  return (
    <>
      {/* Section Header with Generate Report Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-heading">
            Vulnerability Findings
          </h1>
          <p className="text-base text-desc mt-1">
            Correlated security findings, CVE/CWE triage, and remediation tracking
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          aria-label="Generate report"
          onClick={() => setIsDownloadDrawerOpen(true)}
          className="shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Download className="size-icon-xs shrink-0" aria-hidden="true" />
          <span>Generate report</span>
        </Button>
      </div>

      {/* Centralized Data Table */}
      <FindingsView />

      {/* Download Security Report Drawer */}
      <DownloadReportDrawer
        isOpen={isDownloadDrawerOpen}
        onClose={() => setIsDownloadDrawerOpen(false)}
        findings={findings}
      />
    </>
  )
}
