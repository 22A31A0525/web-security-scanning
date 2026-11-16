import { Link } from 'react-router-dom'
import { Settings, User, ChevronDown } from 'lucide-react'
import Input from '../ui/Input'

export default function Navigation() {
  return (
    <header className="w-full bg-canvas px-6 py-3.5 flex items-center justify-between select-none shrink-0 border-b border-border">
      {/* Left: Clickable Logo and Website Name routing to /dashboard */}
      <Link
        to="/dashboard"
        className="flex items-center gap-3 outline-none focus:outline-none focus:ring-0"
      >
        <img
          src="/logo.png"
          alt="Web Security Scanner Logo"
          className="w-6 h-6 object-contain rounded shrink-0"
        />
        <span className="text-h3 text-heading">
          Web-security-scanning
        </span>
      </Link>

      {/* Right: Search bar with subtle badge and action buttons (shrink-0 ensures no cutoff) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Unified Search Input Component */}
        <div className="w-52 sm:w-64 md:w-80">
          <Input
            variant="search"
            readOnly
            placeholder="Search..."
            commandBadge="Ctrl+K"
          />
        </div>

        {/* Settings Button */}
        <button
          type="button"
          aria-label="Settings"
          className="p-2.5 bg-transparent text-desc hover:text-heading hover:bg-surface active:bg-surface rounded-xl transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 shrink-0"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile Button: Unselected sub-button */}
        <button
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 bg-transparent text-desc hover:text-heading hover:bg-surface active:bg-surface active:scale-[0.99] rounded-xl text-sm transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 shrink-0"
        >
          <User className="w-4 h-4 text-desc" />
          <span className="text-sm text-body hover:text-heading whitespace-nowrap">
            Security Analyst
          </span>
          <ChevronDown className="w-4 h-4 text-desc" />
        </button>
      </div>
    </header>
  )
}