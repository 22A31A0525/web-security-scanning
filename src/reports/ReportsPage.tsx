import { useState } from 'react'
import { Download } from 'lucide-react'
import Button from '../ui/Button'
import ReportsView from './ReportsView'
import DownloadReportDrawer from '../findings/DownloadReportDrawer'
import { useEnrichedFindings } from '../store/useAppStore'

export default function ReportsPage() {
  const [isDownloadDrawerOpen, setIsDownloadDrawerOpen] = useState(false)
  const findings = useEnrichedFindings()

  return (
    <>
      {/* Section Header with Download PDF Report Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-heading">
            Audit & Compliance Reports
          </h1>
          <p className="text-base text-desc mt-1">
            Official security attestation, executive vulnerability summaries, and audit records
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

      {/* Centralized Reports Data Table */}
      <ReportsView />

      {/* Generate Custom PDF Report Drawer */}
      <DownloadReportDrawer
        isOpen={isDownloadDrawerOpen}
        onClose={() => setIsDownloadDrawerOpen(false)}
        findings={findings as any}
      />
    </>
  )
}
