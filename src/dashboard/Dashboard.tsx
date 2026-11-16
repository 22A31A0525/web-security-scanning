import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Play, Plus } from 'lucide-react'
import Navigation from '../navigation/Navigation'
import Sidebar from '../navigation/Sidebar'
import SecurityScore from './components/SecurityScore'
import Metrics from './components/Metrics'
import LiveScans from './components/LiveScans'
import AuthScopeChart from './components/AuthScopeChart'
import ResolutionChart from './components/ResolutionChart'
import SeverityTrendChart from './components/SeverityTrendChart'
import Button from '../ui/Button'
import ScansView from '../scans/ScansView'
import TargetsView from '../targets/TargetsView'
import FindingsView from '../findings/FindingsView'
import CreateTargetDrawer from '../targets/CreateTargetDrawer'
import { useAppStore } from '../store/useAppStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const addTarget = useAppStore((state) => state.addTarget)
  const [isCreateTargetOpen, setIsCreateTargetOpen] = useState(false)

  const isTargets = path === '/targets'
  const isScans = path === '/scans'
  const isFindings = path === '/findings'
  const isDashboard =
    path === '/dashboard' ||
    path === '/' ||
    path === ''

  return (
    <div className="h-screen w-full bg-canvas flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navigation />

      {/* Main Body: Sidebar on the left, main content on the right */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar />
        <main
          role="main"
          aria-label="Main content"
          className="flex-1 min-h-0 overflow-y-auto p-6"
        >
          <div className="w-full space-y-6 pb-6">
            {/* Dashboard View */}
            {isDashboard && (
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
                    onClick={() => navigate('/scans')}
                    className="shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <Play className="size-icon-xs fill-current shrink-0" aria-hidden="true" />
                    <span>Run scan</span>
                  </Button>
                </div>

                {/* Single Row Grid: Overall 4 Cards of equal 1fr size */}
                <div
                  role="region"
                  aria-label="Metrics Grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full lg:w-3/5"
                >
                  <SecurityScore />
                  <Metrics />
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
              </>
            )}

            {/* Targets View: Web & API Targets */}
            {isTargets && (
              <>
                {/* Section Header with Add Target Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-h1 text-heading">
                      Web & API Targets
                    </h1>
                    <p className="text-base text-desc mt-1">
                      Monitored web application endpoints and vulnerability attack surface
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    aria-label="Add target"
                    onClick={() => setIsCreateTargetOpen(true)}
                    className="shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="size-icon-xs shrink-0" aria-hidden="true" />
                    <span>Add target</span>
                  </Button>
                </div>

                {/* Targets Telemetry Strip & Centralized Data Table */}
                <TargetsView />
              </>
            )}

            {/* Scans View: Scanning Execution History Only */}
            {isScans && (
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
                    className="shrink-0 self-start sm:self-auto"
                  >
                    <Play className="size-icon-xs fill-current shrink-0" aria-hidden="true" />
                    <span>Launch scan</span>
                  </Button>
                </div>

                {/* Scans Telemetry Strip & Centralized Data Table */}
                <ScansView />
              </>
            )}

            {/* Findings View: Vulnerability Catalog */}
            {isFindings && (
              <>
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-h1 text-heading">
                      Vulnerability Findings
                    </h1>
                    <p className="text-base text-desc mt-1">
                      Correlated security findings, CVE/CWE triage, and remediation tracking
                    </p>
                  </div>
                </div>

                {/* Centralized Data Table */}
                <FindingsView />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Target Multi-Step Drawer */}
      <CreateTargetDrawer
        isOpen={isCreateTargetOpen}
        onClose={() => setIsCreateTargetOpen(false)}
        onCreateTarget={addTarget}
      />
    </div>
  )
}
