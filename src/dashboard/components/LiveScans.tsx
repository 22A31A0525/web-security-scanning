import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Activity } from 'lucide-react'
import Button from '../../ui/Button'
import { useLiveTasks } from '../../store/useAppStore'

export default function LiveScans() {
  const navigate = useNavigate()
  const liveTasks = useLiveTasks()

  return (
    <section
      aria-label="Live Scans"
      className="col-span-1 h-full min-h-[320px] bg-card border border-border rounded-2xl flex flex-col justify-between overflow-hidden"
    >
      {/* Top Header Row with Comfortable Sized Action Button */}
      <div className="flex items-center justify-between min-h-[32px] p-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-heading whitespace-nowrap">
            Live Scans
          </span>
          <span className="text-xs text-desc font-normal">
            ({liveTasks.length} active)
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Open live scans"
          onClick={() => navigate('/scans')}
          className="px-3.5 py-1.5 text-xs border border-border shadow-sm"
        >
          <span>Live scans</span>
          <ArrowUpRight className="size-icon-sm shrink-0 text-desc" aria-hidden="true" />
        </Button>
      </div>

      {/* Main body: Clean records without nested sub-card clutter, fully occupied edge-to-edge dividing borders, secondary button hover highlight */}
      <div className="flex-1 min-h-0 divide-y divide-border border-t border-border overflow-y-auto">
        {liveTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Activity className="size-8 text-desc/40 mb-2" />
            <p className="text-sm text-desc">No live scans currently running</p>
          </div>
        ) : (
          liveTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/scans?scanId=${task.id}`)}
              title={`Open Live Scan #${task.id}`}
              className="p-4 bg-transparent hover:bg-surface transition-colors duration-150 cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-bold text-heading truncate">
                      {task.targetName}
                    </span>
                    <span className="text-xs font-mono text-caption shrink-0">
                      #{task.id}
                    </span>
                  </div>
                  {/* High contrast, crisp non-dull URL */}
                  <span className="text-xs text-heading font-mono truncate block mt-0.5">
                    {task.targetUrl}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Clean Status Text without nested card box or dots */}
                  <span
                    className={`text-xs font-semibold ${
                      task.status === 'running' ? 'text-status-blue' : 'text-status-yellow'
                    }`}
                  >
                    {task.phase}
                  </span>
                  <span className="text-sm font-bold text-heading">
                    {task.progress}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                <div
                  className="bg-heading h-full rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>

              {/* Activity description without premature truncation */}
              <div className="flex items-start justify-between gap-2 text-xs text-desc">
                <span
                  title={task.currentActivity}
                  className="leading-snug break-words line-clamp-2 flex-1 min-w-0"
                >
                  {task.currentActivity}
                </span>
                <span className="font-mono text-caption shrink-0 whitespace-nowrap pt-0.5">
                  {task.eta}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
