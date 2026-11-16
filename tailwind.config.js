/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Centralized Profile Typography Scale (with font-weight & line-height)
        'h1': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],       // 30px desktop heading (bold)
        'h1-mobile': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],  // 20px mobile heading (bold)
        'h2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],        // 20px sub heading (semibold)
        'h3': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],            // 16px sub-sub heading (semibold)
        'title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],     // 20px title (bold)
      },
      spacing: {
        // Centralized Icon Sizing & Spacing Scale (generates size-icon-*, w-icon-*, h-icon-*)
        'icon-xs': '0.875rem', // 14px (compact button icons, CTA micro-icons)
        'icon-sm': '1rem',    // 16px (inline, chevron, tags, badges)
        'icon-md': '1.25rem', // 20px (inputs, settings, actions)
        'icon-lg': '1.5rem',  // 24px (navbar brand, hero)
      },
      size: {
        // Centralized Icon Sizing Scale
        'icon-xs': '0.875rem', // 14px (compact button icons, CTA micro-icons)
        'icon-sm': '1rem',    // 16px (inline, chevron, tags, badges)
        'icon-md': '1.25rem', // 20px (inputs, settings, actions)
        'icon-lg': '1.5rem',  // 24px (navbar brand, hero)
      },
      colors: {
        // Centralized Profile Palette (Single Source of Truth)
        canvas: '#01040a',           // Deep dark canvas & viewport background
        sidebar: '#0d1117',          // Dark sidebar & panel background
        card: '#0d1117',             // Modal, card & container background
        surface: '#161b22',          // Elevated surface (active item, sub-button, hover preview)

        border: '#21262d',           // Container & navbar border
        'border-input': 'rgba(48, 54, 61, 0.9)', // Input border
        'border-focus': '#ffffff',   // Focus ring

        // Semantic Typography Colors
        heading: '#ffffff',          // Titles, H1-H3, primary text
        desc: '#a1a1aa',             // Subtitles, inactive labels, descriptions (zinc-400)
        body: '#d4d4d8',             // Paragraphs, helper text (zinc-300)
        caption: '#71717a',          // Captions, small notes (zinc-500)
        placeholder: '#71717a',      // Input placeholder text (zinc-500)

        // Status & Metrics Palette (Single Source of Truth)
        status: {
          green: '#22c55e',    // Safe / Passed / Active (green-500)
          red: '#f04343',      // Critical / Error / Failed (red-500)
          blue: '#3b82f6',     // Info / Scanning / In-Progress / Low (blue-500)
          orange: '#f97316',   // High severity (orange-500)
          yellow: '#eab308',   // Medium severity (yellow-500)
        },

        // Target Authentication Scope Palette (Single Source of Truth)
        scope: {
          authenticated: '#38bdf8',   // Clear, non-dull, non-pitchy Sky Blue (sky-400)
          unauthenticated: '#64748b', // Refined, balanced Slate (slate-500)
        },
      },
    },
  },
  plugins: [],
}