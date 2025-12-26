# DevSprint Backend - FastAPI

Task Management Kanban Board API built with FastAPI, SQLAlchemy, and PostgreSQL (Supabase).

## Project Structure (5-File Architecture)

```
backend/
├── database.py    # Database connection & session management
├── models.py      # SQLAlchemy ORM models (User, Project, Task)
├── schemas.py     # Pydantic validation schemas
├── crud.py        # Business logic & database queries
├── main.py        # FastAPI routes & JWT authentication
├── requirements.txt
└── .env           # Environment variables (not committed)
```

## Installation

1. Create virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Create a `.env` file in the backend directory (see `.env.example`):

```bash
DATABASE_URL=postgresql://user:password@host.supabase.co:5432/postgres
SECRET_KEY=your-jwt-secret-key-here
```

To generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Running the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs (Swagger): http://localhost:8000/docs
- Alternative Docs (ReDoc): http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /users/` - Register new user
- `POST /token` - Login (returns JWT access token)
- `GET /users/me` - Get current authenticated user
- `GET /users/list` - Get all users (for task assignment)

### Projects
- `POST /projects/` - Create project (Team Lead only)
- `GET /projects/` - Get all projects (user's owned or member projects)
- `GET /projects/{id}` - Get single project details
- `PATCH /projects/{id}` - Update project (Owner only)
- `DELETE /projects/{id}` - Delete project (Owner only)
- `POST /projects/{id}/members` - Add member to project (Owner only)
- `DELETE /projects/{id}/members/{user_id}` - Remove member from project

### Tasks
- `POST /projects/{id}/tasks/` - Create task in project
- `GET /projects/{id}/tasks/` - Get all tasks for project
- `PATCH /tasks/{id}` - Update task (title, description, status, priority, assignee)
- `DELETE /tasks/{id}` - Delete task (Team Lead only)

## Database Schema

Tables automatically created on startup via SQLAlchemy:

- **users** - User accounts with hashed passwords and roles
- **projects** - Project containers owned by Team Leads
- **tasks** - Work items with status, priority, and assignee
- **project_members** - Many-to-many relationship for team membership

### Key Features:
- Cascade deletes for data integrity
- Many-to-many project membership
- Role-based permissions (Lead vs Developer)
- Automatic task unassignment when member removed

## Security

- JWT authentication with expiring tokens (30 min default)
- Bcrypt password hashing via passlib
- Role-based access control (RBAC)
- Protected routes require valid JWT token
- CORS enabled for frontend communication

## Development Notes

- Database connection uses `pool_pre_ping=True` for Supabase reliability
- All timestamps auto-managed by SQLAlchemy
- Foreign key constraints enforce referential integrity
- Pydantic schemas validate all input/output data

