import { Outlet } from 'react-router-dom'
import Navigation from '../navigation/Navigation'
import Sidebar from '../navigation/Sidebar'

export default function Layout() {
  return (
    <div className="h-screen w-full bg-canvas flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navigation />

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
