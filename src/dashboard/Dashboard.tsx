import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import SecurityScore from './components/SecurityScore'
import Metrics from './components/Metrics'
import LiveScans from './components/LiveScans'
import AuthScopeChart from './components/AuthScopeChart'
import ResolutionChart from './components/ResolutionChart'
import SeverityTrendChart from './components/SeverityTrendChart'
import Button from '../ui/Button'

export default function Dashboard() {
  const navigate = useNavigate()

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
          onClick={() => navigate('/scans')}
          className="shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Play className="size-icon-xs fill-current shrink-0" aria-hidden="true" />
          <span>Run scan</span>
        </Button>
      </div>

      {/* Top Row: Clean 4 Cards of equal size */}
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
  )
}
