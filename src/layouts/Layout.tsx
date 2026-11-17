import { Outlet } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import Navigation from '../navigation/Navigation'
import Sidebar from '../navigation/Sidebar'
import { useAppStore } from '../store/useAppStore'

export default function Layout() {
  const error = useAppStore((state) => state.error)

  return (
    <div className="h-screen w-full bg-canvas flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navigation />

      {/* Global Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-status-red/10 border-b border-status-red/30 px-6 py-2.5 flex items-center justify-between text-xs text-status-red shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-status-red" aria-hidden="true" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => useAppStore.setState({ error: null })}
            className="text-status-red/70 hover:text-status-red transition-colors cursor-pointer p-0.5 rounded"
            aria-label="Dismiss error banner"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Main Body: Sidebar on the left, routed view on the right */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar />
        <main
          role="main"
          aria-label="Main content"
          className="flex-1 min-h-0 overflow-y-auto p-6"
        >
          <div className="w-full space-y-6 pb-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
