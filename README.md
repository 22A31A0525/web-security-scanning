# Web Security Scanner

Automated Vulnerability Assessment & DAST Console.

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React (`lucide-react`)
- **Routing:** React Router DOM

## Directory Architecture

```text
src/
├── api/             # Token and authentication API service layer
├── auth/            # Authentication feature modules (Login.tsx)
├── ui/              # Centralized UI components (Button.tsx, Input.tsx)
├── dashboard/       # Dashboard feature module (Dashboard.tsx)
├── navigation/      # Navigation components (Navigation.tsx, Sidebar.tsx)
├── notFound/        # 404 fallback module (NotFound.tsx)
├── store/           # Zustand stores (useAuthStore.ts)
├── App.tsx          # Root routing and ProtectedRoute orchestration
├── index.css        # Tailwind base directives & styling
└── main.tsx         # Application entry point
```

## Tailwind Profile-Level Control

The application implements a centralized design architecture configured at the profile level via `tailwind.config.js`:
- **Single Source of Truth:** Canvas, sidebar, surfaces, borders, and typography scales are centrally governed without manual CSS overrides.
- **Semantic Theme Palette:** Standardized tokens for surfaces (`bg-canvas`, `bg-sidebar`, `bg-card`, `bg-surface`), borders (`border-border`, `border-border-input`), and text colors (`text-heading`, `text-desc`, `text-body`, `text-caption`).
- **Decoupled Typography:** Heading scales (`text-h1`–`text-h3`, `text-title`) and sizing scales (`text-xs`, `text-sm`, `text-base`) are cleanly separated from color definitions for reliable styling across all components.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Authentication & Routes

- **Authentication:** Managed via Zustand (`useAuthStore`) with local bearer token simulation (`src/api/auth.ts`).
- **Connected Routes:**
  - `/login` — Sign-in portal
  - `/dashboard` — Main security scanning console (Protected)
  - `/targets`, `/scans`, `/findings`, `/reports` — Guarded operational views
  - `*` — 404 fallback (`src/notFound/NotFound.tsx`)
