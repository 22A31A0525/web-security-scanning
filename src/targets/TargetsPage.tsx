import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../ui/Button'
import TargetsView from './TargetsView'
import CreateTargetDrawer from './CreateTargetDrawer'
import { useAppStore } from '../store/useAppStore'

export default function TargetsPage() {
  const addTarget = useAppStore((state) => state.addTarget)
  const [isCreateTargetOpen, setIsCreateTargetOpen] = useState(false)

  return (
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

      {/* Create Target Multi-Step Drawer */}
      <CreateTargetDrawer
        isOpen={isCreateTargetOpen}
        onClose={() => setIsCreateTargetOpen(false)}
        onCreateTarget={addTarget}
      />
    </>
  )
}
