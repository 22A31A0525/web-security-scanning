import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Settings, User, ChevronDown, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <header role="banner" className="w-full bg-canvas px-6 py-3.5 flex items-center justify-between shrink-0 border-b border-border">
      {/* Left: Clickable Logo and Website Name routing to /dashboard */}
      <Link
        to="/dashboard"
        aria-label="Web-security-scanning Dashboard"
        className="flex items-center gap-3 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded-lg shrink-0"
      >
        <img
          src="/logo.png"
          alt="Web Security Scanner Logo"
          className="w-6 h-6 size-icon-lg object-contain rounded shrink-0"
        />
        <span className="text-h3 text-heading">
          Web-security-scanning
        </span>
      </Link>

      {/* Right: Search bar with subtle badge and user profile button */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Unified Search Input Component */}
        <div className="w-52 sm:w-64 md:w-80">
          <Input
            variant="search"
            readOnly
            aria-label="Global search"
            placeholder="Search..."
            commandBadge="Ctrl+K"
          />
        </div>

        {/* User Profile Button with Popup Menu and thin border */}
        <div className="relative" ref={menuRef}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            selected={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-label="User account menu"
            className="px-3.5 py-2 shrink-0 border border-border"
          >
            <User className="size-icon-sm text-desc" aria-hidden="true" />
            <span className="text-sm text-body hover:text-heading whitespace-nowrap">
              Security Analyst
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`size-icon-sm text-desc transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {/* Profile Dropdown Popup (same background as sidebar) */}
          {isOpen && (
            <div
              role="menu"
              aria-label="User account actions"
              className="absolute right-0 top-full mt-2 w-56 bg-sidebar border border-border rounded-xl p-2 shadow-2xl z-50 space-y-1"
            >
              {/* User details */}
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-heading truncate">
                  Security Analyst
                </p>
                <p className="text-xs text-desc truncate mt-0.5">
                  {user?.email || 'analyst@security.io'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-1" />

              {/* Settings Action */}
              <Button
                type="button"
                role="menuitem"
                variant="secondary"
                size="sm"
                selected={location.pathname === '/settings'}
                onClick={() => {
                  setIsOpen(false)
                  navigate('/settings')
                }}
                aria-label="Settings"
                className="w-full justify-start text-desc hover:text-heading hover:bg-surface active:bg-surface"
              >
                <Settings className="size-icon-sm text-desc shrink-0" aria-hidden="true" />
                <span>Settings</span>
              </Button>

              {/* Logout action using Button component */}
              <Button
                type="button"
                role="menuitem"
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                aria-label="Logout"
                className="w-full justify-start text-status-red hover:text-status-red hover:bg-surface active:bg-surface"
              >
                <LogOut className="size-icon-sm text-status-red shrink-0" aria-hidden="true" />
                <span>Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}