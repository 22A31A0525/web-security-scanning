import Navigation from '../navigation/Navigation'
import Sidebar from '../navigation/Sidebar'

export default function Dashboard() {
  return (
    <div className="h-screen w-full bg-canvas flex flex-col overflow-hidden select-none">
      {/* Top Navbar */}
      <Navigation />

      {/* Main Body: Sidebar on the left, main content on the right (no scroll when empty) */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto p-6" />
      </div>
    </div>
  )
}