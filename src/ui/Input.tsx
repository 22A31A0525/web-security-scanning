import React, { forwardRef } from 'react'
import { Search } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search'
  label?: React.ReactNode
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
      id,
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
    const generatedId = React.useId()
    const inputId = id || (label ? `input-${generatedId}` : undefined)
    const errorId = error ? `${inputId || generatedId}-error` : undefined

    const baseInputStyles = className.includes('py-') || className.includes('text-')
      ? `w-full !bg-transparent border border-border-input rounded-xl text-heading placeholder:text-placeholder focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus hover:border-desc transition-colors ${className}`
      : `w-full !bg-transparent border border-border-input rounded-xl py-3.5 text-base text-heading placeholder:text-placeholder focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus hover:border-desc transition-colors ${className}`

    const paddingStyles = isSearch
      ? commandBadge
        ? 'pl-11 pr-20 cursor-pointer'
        : rightElement
        ? 'pl-11 pr-10'
        : 'pl-11 pr-4'
      : leftIcon
      ? 'pl-11 pr-4'
      : rightElement
      ? 'pl-4 pr-12'
      : 'px-4'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-heading mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {/* Search Icon or Custom Left Icon */}
          {isSearch ? (
            <Search
              aria-hidden="true"
              className="size-icon-md text-desc absolute left-4 pointer-events-none shrink-0"
            />
          ) : leftIcon ? (
            <div
              aria-hidden="true"
              className="absolute left-4 pointer-events-none flex items-center shrink-0"
            >
              {leftIcon}
            </div>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            style={{ backgroundColor: 'transparent', ...props.style }}
            className={`${baseInputStyles} ${paddingStyles} ${className}`}
            {...props}
          />

          {/* Search Command Badge or Custom Right Element */}
          {isSearch ? (
            commandBadge ? (
              <span
                aria-hidden="true"
                className="absolute right-3.5 px-2 py-0.5 text-xs font-mono font-medium text-desc rounded-md bg-surface border border-border pointer-events-none select-none"
              >
                {commandBadge}
              </span>
            ) : rightElement ? (
              <div className="absolute right-3 flex items-center">
                {rightElement}
              </div>
            ) : null
          ) : rightElement ? (
            <div className="absolute right-4 flex items-center">
              {rightElement}
            </div>
          ) : null}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-semibold text-status-red mt-1.5"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input