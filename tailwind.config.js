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
      colors: {
        // Centralized Profile Palette (Single Source of Truth)
        canvas: '#000000',           // Pure Dark canvas & viewport background
        sidebar: '#09090b',          // Subtle dull dark sidebar background
        card: '#000000',             // Modal & container background
        surface: '#18181b',          // zinc-900 (active sidebar item, selected sub-button, hover preview)

        border: '#27272a',           // zinc-800 container & navbar border
        'border-input': 'rgba(63, 63, 70, 0.9)', // zinc-700/90 input border
        'border-focus': '#ffffff',   // Focus ring

        // Semantic Typography Colors
        heading: '#ffffff',          // Titles, H1-H3, primary text
        desc: '#a1a1aa',             // Subtitles, inactive labels, descriptions (zinc-400)
        body: '#d4d4d8',             // Paragraphs, helper text (zinc-300)
        caption: '#71717a',          // Captions, small notes (zinc-500)
        placeholder: '#71717a',      // Input placeholder text (zinc-500)

        // Status & Metrics Palette
        status: {
          green: '#22c55e', // Safe / Passed / Active (green-500)
          red: '#ef4444',   // Critical / Error / Failed (red-500)
          blue: '#3b82f6',  // Info / Scanning / In-Progress (blue-500)
        },
      },
    },
  },
  plugins: [],
}