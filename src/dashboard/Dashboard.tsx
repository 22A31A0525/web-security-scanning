import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import SecurityScore from './components/SecurityScore'
import {
  TotalTargetsCard,
  TotalScansCard,
  OpenFindingsCard,
  ScanRuntimeCard,
  RemediationSlaCard,
} from './components/Metrics'
import LiveScans from './components/LiveScans'
import AuthScopeChart from './components/AuthScopeChart'
import ResolutionChart from './components/ResolutionChart'
import SeverityTrendChart from './components/SeverityTrendChart'
import OwaspTop10Widget from './components/OwaspTop10Widget'
import TopVulnerableEndpointsWidget from './components/TopVulnerableEndpointsWidget'
import Button from '../ui/Button'
import CreateScanDrawer from '../scans/CreateScanDrawer'

export default function Dashboard() {
  const navigate = useNavigate()
  const [isCreateScanOpen, setIsCreateScanOpen] = useState(false)

  return (
    <>
      {/* Section Header with Run Scan Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-heading">
            Security Posture Overview
          </h1>
          <p className="text-base text-desc mt-1">
            Real-time DAST vulnerability metrics and scan coverage across web targets
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          aria-label="Run scan"
          onClick={() => setIsCreateScanOpen(true)}
          className="shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Play className="size-icon-xs fill-current shrink-0" aria-hidden="true" />
          <span>Run scan</span>
        </Button>
      </div>

      {/* Top Row: Clean 6 Cards Grid (ThreatScore + 5 Key Metrics) */}
      <div
        role="region"
        aria-label="Metrics Grid"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full"
      >
        <SecurityScore />
        <TotalTargetsCard />
        <TotalScansCard />
        <OpenFindingsCard />
        <ScanRuntimeCard />
        <RemediationSlaCard />
      </div>

      {/* Next Row: 3 Canvas Containers */}
      <div
        role="region"
        aria-label="Analytics & Scans"
        className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr] gap-4 w-full"
      >
        <LiveScans />
        <AuthScopeChart />
        <ResolutionChart />
      </div>

      {/* Next Row: Severity Progression Trend */}
      <div role="region" aria-label="Severity Progression Trend" className="w-full">
        <SeverityTrendChart />
      </div>

      {/* Intelligence Row: OWASP Top 10 (50%) + Top Vulnerable Endpoints (50%) */}
      <div
        role="region"
        aria-label="Vulnerability Intelligence"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full"
      >
        <OwaspTop10Widget />
        <TopVulnerableEndpointsWidget />
      </div>

      {/* Create / Run Scan Multi-Step Drawer Directly from Dashboard */}
      <CreateScanDrawer
        isOpen={isCreateScanOpen}
        onClose={() => setIsCreateScanOpen(false)}
        onScanLaunched={(scan) => {
          setIsCreateScanOpen(false)
          navigate(scan?.id ? `/scans?scanId=${scan.id}` : '/scans')
        }}
      />
    </>
  )
}
