import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import Button from '../ui/Button'
import ScansView from './ScansView'
import CreateScanDrawer from './CreateScanDrawer'

export default function ScansPage() {
  const navigate = useNavigate()
  const [isCreateScanOpen, setIsCreateScanOpen] = useState(false)

  return (
    <>
      {/* Section Header with Launch Scan Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-heading">
            Scan Execution History
          </h1>
          <p className="text-base text-desc mt-1">
            DAST crawler pipeline runs, vulnerability analysis phases, and telemetry logs
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          aria-label="Launch scan"
          onClick={() => setIsCreateScanOpen(true)}
          className="shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Play className="size-icon-xs fill-current shrink-0" aria-hidden="true" />
          <span>Launch scan</span>
        </Button>
      </div>

      {/* Scans Telemetry Strip & Centralized Data Table */}
      <ScansView />

      {/* Create / Launch Scan Multi-Step Drawer */}
      <CreateScanDrawer
        isOpen={isCreateScanOpen}
        onClose={() => setIsCreateScanOpen(false)}
        onScanLaunched={() => {
          navigate('/scans')
        }}
      />
    </>
  )
}
