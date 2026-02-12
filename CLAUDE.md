# CLAUDE.md — EC Portal (EC運営ポータル)

## Project Overview

EC Portal is a Japanese-language React SPA for e-commerce store operations management, primarily targeting **Rakuten marketplace** workflows. It provides task management with external service sync (Google Sheets, Chatwork) and a suite of tools for HTML generation, badge processing, and URL generation.

**Deployed to**: Cloudflare Pages (auto-deploys on push to `main`)

## Tech Stack

- **Framework**: React 18.3 with React Router DOM 6.28
- **Language**: JavaScript (ES Modules) with JSX — no TypeScript
- **Build**: Vite 6.0
- **Styling**: Tailwind CSS 3.4 with PostCSS + Autoprefixer
- **Linting**: ESLint 9.15 (flat config) with react, react-hooks, react-refresh plugins
- **Icons**: Google Material Symbols (loaded via CDN in `index.html`)
- **Fonts**: Space Grotesk, Noto Sans JP, Manrope, Inter, Public Sans (Google Fonts CDN)
- **Testing**: None configured
- **CI/CD**: None — deployment is via git push to `main` → Cloudflare Pages auto-build

## Quick Reference Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint on entire project
```

## Project Structure

```
ec-portal/
├── index.html                    # HTML entry point (ja locale, CDN fonts/icons)
├── package.json                  # ES module project config
├── vite.config.js                # Vite + React plugin
├── tailwind.config.js            # Custom colors, fonts, dark mode (class-based)
├── postcss.config.js             # Tailwind + Autoprefixer
├── .agent/workflows/deploy.md    # Deployment documentation (Japanese)
├── src/
│   ├── main.jsx                  # React DOM entry (StrictMode)
│   ├── App.jsx                   # BrowserRouter + route definitions
│   ├── index.css                 # Tailwind directives + custom component classes
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx    # Page wrapper (Sidebar + Header + MobileNav)
│   │   │   ├── Sidebar.jsx       # Desktop left sidebar navigation
│   │   │   ├── Header.jsx        # Top header bar
│   │   │   └── MobileNav.jsx     # Mobile bottom navigation bar
│   │   └── ui/
│   │       ├── TaskCard.jsx      # Task display card component
│   │       └── FilterChip.jsx    # Filter button with count badge
│   ├── pages/
│   │   ├── TaskList.jsx          # Home — task management with filters
│   │   ├── TaskCreate.jsx        # New task creation form
│   │   ├── HTMLGenerator.jsx     # Product spec table HTML generator
│   │   ├── BadgeTool.jsx         # Image badge overlay processor (Canvas API)
│   │   ├── URLGenerator.jsx      # Rakuten bookmark/coupon URL generator
│   │   └── Settings.jsx          # API keys configuration page
│   ├── contexts/
│   │   └── ProjectContext.jsx    # Global state (tasks, sync, service status)
│   └── services/
│       ├── index.js              # Service init, status, and connection testing
│       ├── sheets.js             # Google Sheets API wrapper (read-only, API key)
│       └── chatwork.js           # Chatwork API wrapper (read/write, token auth)
└── dist/                         # Build output (gitignored)
```

## Routing

Defined in `src/App.jsx`:

| Path | Page Component | Description |
|------|---------------|-------------|
| `/` | `TaskList` | Task management home (default) |
| `/task-create` | `TaskCreate` | Create new task |
| `/html-generator` | `HTMLGenerator` | Product HTML table generator |
| `/badge-tool` | `BadgeTool` | Image badge overlay tool |
| `/url-generator` | `URLGenerator` | Rakuten URL generation |
| `/settings` | `Settings` | API configuration |

## Architecture & Patterns

### State Management
- **React Context API** via `ProjectContext` — no Redux or external state library
- `useProject()` custom hook to consume context
- Services initialized on mount via `initializeServices()`

### Layout Pattern
All pages use `MainLayout` which composes:
- `Sidebar` (desktop, fixed left, `lg:ml-72`)
- `Header` (top bar)
- `MobileNav` (bottom bar, mobile only)

### Service Integration Pattern
Services in `src/services/` follow a consistent pattern:
- `configure(config)` — set API keys/tokens
- `loadConfig()` — restore from `localStorage`
- `isConfigured()` — check if ready to use
- Configuration stored in `localStorage` (keys: chatwork API token + room ID, sheets API key + spreadsheet ID)

### Data Flow
- Tasks: In-memory React state with optional sync from Google Sheets / Chatwork
- No backend database — all persistence is `localStorage` or external APIs
- Task IDs use `Date.now()` for local tasks, prefixed IDs (`sheet_`, `cw_`) for synced tasks

## Styling Conventions

- **Tailwind CSS** utility classes for all styling
- Custom colors defined in `tailwind.config.js`:
  - `primary`: `#0d91a5` (teal)
  - `rakuten-red`: `#bf0000`
  - `chatwork-blue`: `#005BAC`
  - `sidebar-dark`: `#1e293b`
  - `background-light`: `#f8fafa`
  - `background-dark`: `#1a1a1a`
- Dark mode supported via `class` strategy
- Custom component classes in `src/index.css` (`@layer components`): `bento-card`, `glass-sidebar`, `no-scrollbar`, `tab-active`, `toggle-checkbox`
- Base body font: `Noto Sans JP`

## Code Conventions

- **ES Modules** (`"type": "module"` in package.json) — use `import`/`export`, not `require`
- **JSX** files use `.jsx` extension
- **4-space indentation** throughout the codebase
- **Function components** only — no class components
- **Named exports** for providers and hooks; **default exports** for page and layout components
- **Japanese language** for all UI text, comments in deploy docs, and task data
- **No TypeScript** — despite `@types/react` being installed, all source is plain JavaScript

## Deployment

Platform: **Cloudflare Pages** (auto-deploy on push to `main`)

```bash
# Verify build locally before deploying
npm run build
npm run preview

# Deploy (push to main triggers auto-build)
git add .
git commit -m "feat: description of change"
git push origin main
```

Build settings: `npm run build` → output directory `dist`

## Key Considerations for AI Assistants

1. **No test suite exists** — there are no test files or test runners configured. Verify changes by running `npm run build` to confirm the project compiles.
2. **No ESLint config file at project root** — ESLint 9 flat config may be auto-detected or missing. Run `npm run lint` to check.
3. **All UI text is in Japanese** — maintain Japanese for user-facing strings.
4. **Client-side only** — no server, no database, no SSR. All data is in React state or `localStorage`.
5. **External API keys** are stored in `localStorage` — never commit API keys or secrets.
6. **Vite dev server** is the primary development tool — use `npm run dev` for hot-reload development.
7. **Canvas API** is used in `BadgeTool.jsx` for client-side image processing.
8. **Commit messages** follow conventional format: `feat:`, `fix:`, `docs:`, etc. Descriptions can be in Japanese.
