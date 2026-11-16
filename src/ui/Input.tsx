import React, { forwardRef } from 'react'
import { Search } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search'
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
  commandBadge?: string
}

/**
 * Unified Input Component (Controlled Centrally via Tailwind Tokens):
 * - Geometry: Height (py-3.5), rounded-xl, bg-canvas, border-border-input.
 * - Focus: focus:border-border-focus focus:ring-1 focus:ring-border-focus hover:border-desc.
 * - Typography: text-desc text-heading placeholder:text-placeholder.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      label,
      error,
      leftIcon,
      rightElement,
      commandBadge,
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const isSearch = variant === 'search'

    const baseInputStyles =
      'w-full bg-canvas border border-border-input rounded-xl py-3.5 text-base text-heading placeholder:text-placeholder focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus hover:border-desc transition-colors'

    const paddingStyles = isSearch
      ? 'pl-11 pr-20 cursor-pointer'
      : leftIcon
      ? 'pl-11 pr-4'
      : rightElement
      ? 'pl-4 pr-12'
      : 'px-4'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-heading mb-2">
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {/* Search Icon or Custom Left Icon */}
          {isSearch ? (
            <Search className="w-5 h-5 text-desc absolute left-4 pointer-events-none shrink-0" />
          ) : leftIcon ? (
            <div className="absolute left-4 pointer-events-none flex items-center shrink-0">
              {leftIcon}
            </div>
          ) : null}

          <input
            ref={ref}
            type={type}
            className={`${baseInputStyles} ${paddingStyles} ${className}`}
            {...props}
          />

          {/* Search Command Badge or Custom Right Element */}
          {isSearch ? (
            <span className="absolute right-3.5 px-1.5 py-0.5 text-xs font-mono font-semibold text-canvas rounded bg-heading pointer-events-none select-none">
              {commandBadge || 'Ctrl+K'}
            </span>
          ) : rightElement ? (
            <div className="absolute right-4 flex items-center">
              {rightElement}
            </div>
          ) : null}
        </div>

        {error && (
          <p className="text-sm font-semibold text-status-red mt-1.5">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input