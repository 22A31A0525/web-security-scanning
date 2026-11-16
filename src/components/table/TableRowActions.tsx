import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import Button from '../../ui/Button'

export interface ActionItem {
  label: string
  icon?: React.ReactNode
  danger?: boolean
  onClick: () => void
}

export interface TableRowActionsProps {
  actions: ActionItem[]
}

export default function TableRowActions({ actions }: TableRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative inline-flex items-center justify-center" ref={menuRef}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        className="p-1 text-desc hover:text-heading hover:bg-surface rounded-lg transition-colors cursor-pointer"
      >
        <MoreVertical className="size-icon-xs" aria-hidden="true" />
      </Button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Actions"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1.5 z-40 w-36 bg-sidebar border border-border rounded-xl p-1 shadow-2xl space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
        >
          {actions.map((act) => (
            <button
              key={act.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                act.onClick()
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left cursor-pointer transition-colors ${
                act.danger
                  ? 'text-status-red hover:bg-surface'
                  : 'text-desc hover:text-heading hover:bg-surface'
              }`}
            >
              {act.icon && <span className="shrink-0">{act.icon}</span>}
              <span className="truncate font-medium">{act.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
