# Web Security Scanner

Automated Vulnerability Assessment & DAST Console.

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Centralized Profile Configuration)
- **State Management:** Zustand
- **Icons:** Lucide React (`lucide-react`)
- **Charts:** Recharts
- **Routing:** React Router DOM

---

## Centralized Design System (`tailwind.config.js`)

All visual styling—background levels, popups, sidebars, borders, typography scales, text colors, and icon sizing—is governed **100% centrally** via [`tailwind.config.js`](./tailwind.config.js) as the single source of truth. There are no manual CSS overrides or hardcoded styling clutter.


## Directory Architecture

```text
src/
├── api/             # Token simulation & authentication service layer
├── auth/            # Sign-in portal (Login.tsx)
├── components/
│   └── table/       # Modular DataTable, TableFilterBar, TableRowActions, schemas
├── dashboard/       # Dashboard view & telemetry widgets (SecurityScore, LiveScans, Charts)
├── data/            # Realistic mock datasets & test scenarios
├── findings/        # Vulnerability findings view
├── navigation/      # Navigation header (Navigation.tsx) and sidebar (Sidebar.tsx)
├── notFound/        # 404 fallback module (NotFound.tsx)
├── scans/           # DAST execution view & ScanDetailDrawer.tsx
├── services/        # Mock telemetry services
├── store/           # Zustand stores (useAppStore.ts, useAuthStore.ts)
├── targets/         # Monitored attack surface & target management view
├── types/           # Strongly typed schemas & telemetry data models
├── ui/              # Centralized UI primitives (Button.tsx, Input.tsx)
├── App.tsx          # Root routing and ProtectedRoute orchestration
├── index.css        # Tailwind base directives & sleek custom scrollbar
└── main.tsx         # Application entry point
```

---

## Layout & Zero-Scroll Guarantee

- **Root Viewport:** The application layout is strictly zero-scroll (`h-screen w-full bg-canvas flex flex-col overflow-hidden select-none`).
- **Main Viewport:** Main content container uses `flex-1 min-h-0 overflow-y-auto` so page scrolling only activates when content exceeds viewport bounds.
- **Custom Sleek Scrollbar:** Ultra-thin 6px gutter defined cleanly via `theme('colors.canvas')` and `theme('colors.border')` in `src/index.css`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript typecheck (verification only, no build)
npx tsc --noEmit
```

---

## Authentication & Routes

- **Authentication:** Managed via Zustand (`useAuthStore`) with local bearer token simulation (`src/api/auth.ts`).
- **Connected Routes:**
  - `/login` — Sign-in portal
  - `/dashboard` — Main security scanning console (Protected)
  - `/targets` — Target infrastructure & attack surfaces
  - `/scans` — Active and completed DAST scans
  - `/findings` — Vulnerability findings & CWE classifications
  - `/settings` — API tokens and endpoint configuration
  - `*` — 404 fallback (`src/notFound/NotFound.tsx`)
