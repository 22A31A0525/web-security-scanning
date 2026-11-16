// Centralized Profile Theme Tokens
// Single source of truth shared by tailwind.config.js and TypeScript runtime code.

export const themeTokens = {
  colors: {
    // Canvas & Containers
    canvas: '#01040a',
    sidebar: '#0d1117',
    card: '#0d1117',
    surface: '#161b22',

    // Borders
    border: '#21262d',
    'border-input': 'rgba(48, 54, 61, 0.9)',
    'border-focus': '#ffffff',

    // Typography
    heading: '#ffffff',
    desc: '#a1a1aa',
    body: '#d4d4d8',
    caption: '#71717a',
    placeholder: '#71717a',

    // Status & Metrics
    status: {
      green: '#22c55e',
      red: '#f04343',
      blue: '#3b82f6',
      orange: '#f97316',
      yellow: '#eab308',
    },

    // Authentication Scope
    scope: {
      authenticated: '#38bdf8',
      unauthenticated: '#64748b',
    },
  },
  typography: {
    h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
    'h1-mobile': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
    h2: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
    h3: ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
    title: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
  },
  spacing: {
    'icon-xs': '0.875rem', // 14px
    'icon-sm': '1rem',    // 16px
    'icon-md': '1.25rem', // 20px
    'icon-lg': '1.5rem',  // 24px
    'dropdown-w': '14rem',
    'dropdown-h': '16rem',
    'table-view': '38.75rem', // 620px
    'drawer-log': '28.75rem', // 460px
    'chart-h': '20rem',      // 320px
  },
} as const

export const themeColors = themeTokens.colors
