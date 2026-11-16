import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  Activity,
  ShieldAlert,
  Key,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export default function Sidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const targets = useAppStore((state) => state.targets)
  const scans = useAppStore((state) => state.scans)
  const findings = useAppStore((state) => state.findings)

  const isSettings = location.pathname === '/settings'

  interface NavItem {
    label: string
    path: string
    icon: typeof LayoutDashboard
    count?: number
  }

  // Dynamic navigation items: when on /settings, displays only APIs; otherwise displays main navigation
  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Targets', path: '/targets', icon: Target, count: targets.length },
    { label: 'Scans', path: '/scans', icon: Activity, count: scans.length },
    { label: 'Findings', path: '/findings', icon: ShieldAlert, count: findings.length },
  ]

  const settingsNavItems: NavItem[] = [
    { label: 'APIs', path: '/settings', icon: Key },
  ]

  const navItems: NavItem[] = isSettings ? settingsNavItems : mainNavItems

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`h-full bg-sidebar flex flex-col justify-between shrink-0 select-none border-r-0 transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-56 sm:w-60'
      }`}
    >
      {/* Navigation Items (Single Plain List) */}
      <nav aria-label="Navigation links" className="p-3 space-y-1 overflow-hidden">
        {/* Context Exit / Back Navigation when in Settings */}
        {isSettings && (
          <div className="pb-1 mb-1">
            <Link
              to="/dashboard"
              title={collapsed ? 'Back to Dashboard' : undefined}
              aria-label="Back to Dashboard"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-desc hover:text-heading hover:bg-surface active:bg-surface transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar select-none ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <ArrowLeft className="size-icon-sm shrink-0 text-desc" aria-hidden="true" />
              {!collapsed && <span>Back to Dashboard</span>}
            </Link>
          </div>
        )}

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
              title={
                collapsed
                  ? typeof item.count === 'number'
                    ? `${item.label} (${item.count})`
                    : item.label
                  : undefined
              }
              aria-label={
                typeof item.count === 'number'
                  ? `${item.label} (${item.count})`
                  : item.label
              }
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar select-none ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-surface text-heading font-semibold'
                  : 'text-desc hover:text-heading hover:bg-surface active:bg-surface'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`size-icon-sm shrink-0 ${isActive ? 'text-heading' : 'text-desc'}`}
                    aria-hidden="true"
                  />
                  {collapsed && typeof item.count === 'number' && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[10px] font-mono font-semibold leading-none select-none transition-colors ${
                        isActive ? 'text-heading' : 'text-caption'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && typeof item.count === 'number' && (
                <span
                  className={`text-xs font-mono font-medium shrink-0 transition-colors ${
                    isActive ? 'text-heading' : 'text-caption'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Collapse / Expand Button with top border attached to sidebar */}
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-desc hover:text-heading hover:bg-surface active:bg-surface rounded-xl transition-colors cursor-pointer outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar select-none ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-icon-sm shrink-0 text-desc" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="size-icon-sm shrink-0 text-desc" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}