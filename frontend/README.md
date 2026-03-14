# UCPC Frontend

Frontend uses Vite + React + TypeScript with modular routing, Redux (global state), and Zustand (local feature actions).

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file from template:

```bash
cp .env.example .env
```

3. Run development server:

```bash
npm run dev
```

## Scripts

- `npm run dev`: start local dev server
- `npm run typecheck`: run TypeScript checks
- `npm run build`: build production bundle
- `npm run preview`: preview production build locally

## Environment Variables

- `VITE_API_BASE_URL`: base URL for backend API requests

Example:

```env
VITE_API_BASE_URL=http://localhost:8080
```
