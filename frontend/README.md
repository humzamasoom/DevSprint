# DevSprint Frontend

React + TypeScript + Vite application for task management with Kanban board.

## Features

- Modern, responsive UI with TailwindCSS
- Drag-and-drop Kanban board (@hello-pangea/dnd)
- Real-time optimistic updates (TanStack Query)
- Smooth animations (Framer Motion)
- Toast notifications (Sonner)
- Role-based UI (Team Lead vs Developer views)
- JWT authentication with auto-refresh

## Installation

```bash
npm install
```

## Configuration

The API URL is configured in `src/lib/api.ts`:
```typescript
baseURL: 'http://localhost:8000'
```

## Development

```bash
npm run dev
```

Runs on http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Navbar.tsx
│   ├── Layout.tsx
│   ├── ProjectCard.tsx
│   ├── TaskCard.tsx
│   └── *Modal.tsx    # Various modal components
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── lib/              # API clients and utilities
│   ├── api.ts       # Axios instance with interceptors
│   ├── auth.ts      # Authentication API
│   ├── projects.ts  # Projects API
│   ├── tasks.ts     # Tasks API
│   └── users.ts     # Users API
├── pages/            # Route pages
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   └── ProjectBoardPage.tsx
├── types/            # TypeScript interfaces
│   └── index.ts
├── App.tsx           # Main app with routing
└── main.tsx          # Entry point
```

## Key Technologies

- **React Query** - Server state management with caching
- **React Router** - Client-side routing
- **Axios** - HTTP client with JWT interceptor
- **Framer Motion** - Declarative animations
- **TailwindCSS** - Utility-first styling
- **@hello-pangea/dnd** - Accessible drag-and-drop
