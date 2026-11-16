import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  Activity,
  ShieldAlert,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Plain List: All navigation items in one continuous list (no subsection headers or divider)
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Targets', path: '/targets', icon: Target },
    { label: 'Scans', path: '/scans', icon: Activity },
    { label: 'Findings', path: '/findings', icon: ShieldAlert },
    { label: 'Reports', path: '/reports', icon: FileText },
  ]

  return (
    <aside
      className={`h-full bg-sidebar flex flex-col justify-between shrink-0 select-none border-r-0 transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-56 sm:w-60'
      }`}
    >
      {/* Navigation Items (Single Plain List) */}
      <div className="p-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          // Auto-select Dashboard when at '/' or '/dashboard', otherwise match exact path
          const isDashboard =
            item.path === '/dashboard' &&
            (location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '')
          const isActive = location.pathname === item.path || isDashboard

          return (
            <Link
              key={item.label}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-surface text-heading font-semibold'
                  : 'text-desc hover:text-heading hover:bg-surface active:bg-surface'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-heading' : 'text-desc'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Bottom Collapse / Expand Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-desc hover:text-heading hover:bg-surface active:bg-surface rounded-xl transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:outline-none select-none ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 shrink-0 text-desc" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0 text-desc" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}