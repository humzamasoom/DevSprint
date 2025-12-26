# DevSprint - Task Management Kanban Board

**CSC336 - Web Technologies - Lab Terminal Project**

A full-stack task management application with drag-and-drop Kanban board functionality built with React, FastAPI, and PostgreSQL.

## Features

- User authentication (Register/Login with JWT)
- Role-based access control (Team Lead / Developer)
- Project management (Create, Read, Update, Delete)
- Kanban board with drag-and-drop
- Task management with status tracking
- Team member management
- Real-time optimistic UI updates
- Toast notifications

## Tech Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL (Supabase)
- JWT Authentication
- Bcrypt password hashing

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS
- TanStack Query (React Query)
- @hello-pangea/dnd (Drag & Drop)
- Framer Motion (Animations)
- Axios (HTTP Client)
- Sonner (Toast Notifications)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database (Supabase account)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create `.env` file (see `backend/.env.example`):
   ```bash
   DATABASE_URL=your_supabase_connection_string
   SECRET_KEY=your_secret_key_here
   ```

6. Run the server:
   ```bash
   python main.py
   ```
   Server runs on http://localhost:8000
   API docs at http://localhost:8000/docs

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## Usage

1. Register a new account at http://localhost:5173/register
2. Choose your role (Team Lead or Developer)
3. Login with your credentials
4. Team Leads can create projects and invite members
5. Create tasks and drag them across the Kanban board
6. Assign tasks to team members

## Architecture

This project follows a strict Service-Repository pattern:

**Backend (5-file structure):**
- `database.py` - Database connection & session management
- `models.py` - SQLAlchemy ORM models
- `schemas.py` - Pydantic validation schemas
- `crud.py` - Business logic & database operations
- `main.py` - FastAPI routes & application entry

**Frontend:**
- Component-based React architecture
- Context API for authentication state
- TanStack Query for server state management
- Type-safe API client with Axios interceptors

## Documentation

For complete project documentation including:
- **Scope Statement:** See [SCOPE.md](SCOPE.md)
- **Full Documentation:** See [DOCUMENTATION.md](DOCUMENTATION.md)
- **Backend API:** See [backend/README.md](backend/README.md)
- **Frontend Details:** See [frontend/README.md](frontend/README.md)

## Lab Requirements Compliance

✅ Single Page Application (SPA)  
✅ High interactivity (drag-and-drop Kanban)  
✅ Business logic with CRUD operations  
✅ Multiple actors (Team Lead, Developer)  
✅ React components with hooks  
✅ REST API with FastAPI  
✅ ORM (SQLAlchemy) with Pydantic validation  
✅ Professional CSS (TailwindCSS)  
✅ Complete documentation  

## Team Information

**Project Members:**
- [Student Name] - [Student ID]
- [Add team members here]

## License

Academic project - DevSprint Task Management System  
CSC336 - Web Technologies - Fall 2025

