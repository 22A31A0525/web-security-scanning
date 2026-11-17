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
import FindingsOverTimeChart from './components/FindingsOverTimeChart'
import OwaspTop10Widget from './components/OwaspTop10Widget'
import TopVulnerableEndpointsWidget from './components/TopVulnerableEndpointsWidget'
import TimelineFilterPopover from './components/TimelineFilterPopover'
import Button from '../ui/Button'
import CreateScanDrawer from '../scans/CreateScanDrawer'
import { useAppStore } from '../store/useAppStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const [isCreateScanOpen, setIsCreateScanOpen] = useState(false)
  const dashboardTimeline = useAppStore((state) => state.dashboardTimeline)
  const setDashboardTimeline = useAppStore((state) => state.setDashboardTimeline)

  return (
    <>
      {/* Section Header with Global Timeline Selector and Run Scan Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-heading">
            Security Posture Overview
          </h1>
          <p className="text-base text-desc mt-1">
            Real-time DAST vulnerability metrics and scan coverage across web targets
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {/* Centralized Global Timeline Filter controlling all dashboard charts & widgets */}
          <TimelineFilterPopover
            value={dashboardTimeline}
            onChange={setDashboardTimeline}
          />
          <Button
            type="button"
            variant="primary"
            size="md"
            aria-label="Run scan"
            onClick={() => setIsCreateScanOpen(true)}
            className="cursor-pointer"
          >
            <Play className="size-icon-xs fill-current shrink-0" aria-hidden="true" />
            <span>Run scan</span>
          </Button>
        </div>
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

      {/* Middle Analytics Row: Auth Scope + Vulnerability Resolution + Findings Over Time (All 3 in 1 Row) */}
      <div
        role="region"
        aria-label="Target Authentication, Resolution and Findings Over Time"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full"
      >
        <AuthScopeChart />
        <ResolutionChart />
        <FindingsOverTimeChart />
      </div>

      {/* Progression Row: Severity Progression Trend */}
      <div role="region" aria-label="Progression and Burn-down Trends" className="w-full">
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

      {/* Bottom Dedicated Section: Live / Recent Scans Execution Component */}
      <div role="region" aria-label="Live Scans Activity" className="w-full">
        <LiveScans />
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
