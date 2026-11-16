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

### 1. Surface & Background Tokens

| Surface Role | Token | Hex Color | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas / Main Background** | `bg-canvas` | `#01040a` | Deep dark page viewport, window backdrop, and main body canvas |
| **Sidebar & Panels** | `bg-sidebar` | `#0d1117` | Collapsible left navigation sidebar and panel backdrops |
| **Card / Modal / Popups** | `bg-card` | `#0d1117` | Metric cards, popover dropdowns, slide-over drawers, dialogs, and table containers |
| **Elevated Surface** | `bg-surface` | `#161b22` | Active sidebar pills, selected sub-buttons, hover preview rows, and chip badges |

### 2. Border & Divider Tokens

| Border Role | Token | Color / RGBA | Usage |
| :--- | :--- | :--- | :--- |
| **Standard Border** | `border-border` | `#21262d` | Container outlines, card borders, navbar bottom divider, and table row lines |
| **Input Border** | `border-border-input` | `rgba(48, 54, 61, 0.9)` | Text inputs, search bars, and dropdown fields |
| **Focus Border** | `border-border-focus` | `#ffffff` | Keyboard focus indicator and ring highlight |

### 3. Semantic Typography Palette

| Text Role | Token | Hex Color | Usage |
| :--- | :--- | :--- | :--- |
| **Heading** | `text-heading` | `#ffffff` | Primary titles, modal headings, and high-emphasis labels |
| **Body** | `text-body` | `#d4d4d8` | Standard paragraphs and helper text |
| **Description** | `text-desc` | `#a1a1aa` | Subtitles, column headers, inactive labels, and secondary stats |
| **Caption / Placeholder** | `text-caption` / `placeholder:text-placeholder` | `#71717a` | Micro notes, metadata stamps, and input placeholders |

### 4. Status & Severity Palette

| Status / Severity | Token | Hex Color | Usage |
| :--- | :--- | :--- | :--- |
| **Critical / Error** | `text-status-red` / `bg-status-red` | `#f04343` | Critical vulnerabilities, failed checks, and validation errors |
| **High** | `text-status-orange` / `bg-status-orange` | `#f97316` | High-severity findings and alerts |
| **Medium** | `text-status-yellow` / `bg-status-yellow` | `#eab308` | Medium-severity findings and warnings |
| **Safe / Passed** | `text-status-green` / `bg-status-green` | `#22c55e` | Passed audits, healthy posture, and safe targets |
| **Info / Active** | `text-status-blue` / `bg-status-blue` | `#3b82f6` | Running scans, info findings, and in-progress tasks |

### 5. Standardized Typography Scale

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-h1` | `1.875rem` (30px) | `2.25rem` | 700 (Bold) | Desktop main page headings |
| `text-h1-mobile` | `1.25rem` (20px) | `1.75rem` | 700 (Bold) | Mobile page headings |
| `text-h2` | `1.25rem` (20px) | `1.75rem` | 600 (Semibold) | Section subheadings |
| `text-h3` | `1.00rem` (16px) | `1.50rem` | 600 (Semibold) | Component card headers & logo text |
| `text-title` | `1.25rem` (20px) | `1.75rem` | 700 (Bold) | Major modal and drawer titles |

### 6. Centralized Icon Scale

| Token | Dimension | Pixels | Usage |
| :--- | :--- | :--- | :--- |
| `size-icon-xs` | `0.875rem` | 14px | Micro actions, pagination arrows, and inline tags |
| `size-icon-sm` | `1.000rem` | 16px | Standard button icons, chevrons, and menu icons |
| `size-icon-md` | `1.250rem` | 20px | Navigation items, search bar icons, and settings |
| `size-icon-lg` | `1.500rem` | 24px | Navbar branding and hero icons |

---

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
