# AGENTS.md - React + Vite App

## Build & Test Commands
- **Dev**: `npm run dev` - Starts Vite dev server (HMR enabled)
- **Build**: `npm run build` - Production build to `dist/`
- **Lint**: `npm run lint` - Run ESLint on all files
- **Preview**: `npm run preview` - Preview production build locally

## Architecture
- **Framework**: React 19.2 + Vite 7.2 (ES modules)
- **Routing**: React Router v7 with BrowserRouter
- **Backend**: Supabase (@supabase/supabase-js) for auth & DB
- **Build Tool**: Vite with Babel via @vitejs/plugin-react
- **Structure**: 
  - `src/App.jsx` - Main router (/, /login, /register, /app)
  - `src/pages/` - Page components (Login, Register, AppHome)
  - `src/libs/` - Custom utilities/helpers
  - `src/assets/` - Static images/files
  - `vite.config.js` - Minimal config with React plugin
  - `eslint.config.js` - ESLint with React rules

## Code Style & Conventions
- **Language**: JavaScript (JSX), not TypeScript
- **Naming**: PascalCase for components, camelCase for variables
- **Imports**: ES modules (`import`/`export`)
- **Formatting**: No formatter configured (add Prettier if needed)
- **Linting**: ESLint 9.39 with:
  - @eslint/js recommended rules
  - react-hooks & react-refresh plugins
  - Unused vars ignored if starting with uppercase or underscore
- **Error Handling**: Follow React error boundaries best practice
- **State**: Use React hooks (useState, useContext, etc.)
