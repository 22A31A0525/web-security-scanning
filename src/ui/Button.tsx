import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' // 'primary' = Main Button, 'secondary' = Sub Button
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean // Sub-button only gets the highlighted surface background when selected
  children: React.ReactNode
}

/**
 * Standard Button Component:
 * - Main Button (variant="primary"): Solid pure white background, pure black text. Dims with theme palette on hover and active.
 * - Sub Button (variant="secondary"):
 *   - When selected (selected={true}): Solid bg-surface, text-heading, font-semibold.
 *   - When unselected (default): Non-highlighted bg-transparent, text-desc; on hover displays the selected bg-surface with text-heading.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  selected = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'rounded-xl font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 active:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }

  const secondaryStyles = selected
    ? 'bg-surface text-heading font-semibold hover:bg-surface active:bg-surface active:scale-[0.99] shadow-none'
    : 'bg-transparent text-desc hover:text-heading hover:bg-surface active:bg-surface active:scale-[0.99] shadow-none'

  const variantStyles = {
    // Main button: Solid white background with pure black text; dims with theme palette on hover and active
    primary:
      'bg-heading text-canvas hover:bg-body active:bg-desc active:scale-[0.99] shadow-none',
    // Sub button: On hover previews the selected surface background
    secondary: secondaryStyles,
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}