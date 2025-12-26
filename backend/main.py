"""
FastAPI application entry point.
Defines API routes and initializes the application.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session, joinedload

import models
import schemas
import crud
from database import engine, get_db

# Load environment variables from .env file
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is required! "
        "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# ==================== JWT Helper Functions ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing claims to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session (injected)
        
    Returns:
        Current authenticated User model instance
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=email)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=token_data.username)
    if user is None:
        raise credentials_exception
    
    return user


# Create all database tables in Supabase
# This runs once when the application starts
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI application
app = FastAPI(
    title="DevSprint API",
    description="Task Management Kanban Board API",
    version="1.0.0"
)

# CORS Configuration - Allow frontend to communicate with backend
# Development: Allow all origins to prevent connection errors
# Production: Replace ["*"] with specific frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)


# ==================== Root Endpoint ====================

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "message": "DevSprint API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


# ==================== Authentication Endpoints ====================

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login endpoint - OAuth2 compatible token authentication.
    
    Args:
        form_data: OAuth2PasswordRequestForm with username (email) and password
        db: Database session (injected)
        
    Returns:
        JWT access token
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Authenticate user (username field contains email)
    user = crud.authenticate_user(db, email=form_data.username, password=form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# ==================== User Endpoints ====================

@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    
    Args:
        user: UserCreate schema with registration data
        db: Database session (injected)
        
    Returns:
        Created user (without password)
        
    Raises:
        HTTPException: If email already exists
    """
    # Check if user already exists
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    return crud.create_user(db=db, user=user)


@app.get("/users/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """
    Get currently logged-in user's details (Protected Route - Requires Authentication).
    Used by frontend to verify authentication and get user role.
    
    Args:
        current_user: Authenticated user from JWT token
        
    Returns:
        Current user's information (password excluded)
    """
    return current_user


@app.get("/users/list", response_model=list[schemas.UserResponse])
def get_users_list(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get list of all users (Protected Route - Requires Authentication).
    Used for task assignment dropdown in UI.
    
    Args:
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        List of all users (passwords excluded)
    """
    return crud.get_all_users(db=db)


# ==================== Project Endpoints ====================

@app.post("/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new project (Protected Route - Requires Authentication & Lead Role).
    
    Args:
        project: ProjectCreate schema
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        Created project
        
    Raises:
        HTTPException: If user is not a Team Lead
    """
    # RBAC: Only Team Leads can create projects
    if current_user.role != models.Role.lead:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a Team Lead can create projects"
        )
    
    return crud.create_project(db=db, project=project, user_id=current_user.id)


@app.get("/projects/", response_model=list[schemas.ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all projects for the current user (Protected Route - Requires Authentication).
    Returns projects where user is owner OR member.
    
    Args:
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        List of projects owned by or shared with the current user
    """
    return crud.get_projects(db=db, user_id=current_user.id)


@app.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get a single project by ID (Protected Route - Requires Authentication).
    User must be owner or member of the project.
    
    Args:
        project_id: ID of the project
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        Project details
        
    Raises:
        HTTPException: If project not found or user lacks access
    """
    project = db.query(models.Project).options(
        joinedload(models.Project.members)
    ).filter(models.Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user has access (owner or member)
    is_owner = project.owner_id == current_user.id
    is_member = any(member.id == current_user.id for member in project.members)
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project"
        )
    
    return project


@app.post("/projects/{project_id}/members", status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: int,
    member: schemas.ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Add a member to a project (Protected Route - Requires Authentication & Lead Role).
    Only the project owner can add members.
    
    Args:
        project_id: ID of the project
        member: ProjectMemberCreate schema with user_id
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If project not found, user is not owner, or member not found
    """
    # RBAC: Only Team Leads can add members
    if current_user.role != models.Role.lead:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a Team Lead can add members to projects"
        )
    
    # Fetch the project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify the current user is the project owner
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can add members"
        )
    
    # Check if the user exists
    user_to_add = db.query(models.User).filter(models.User.id == member.user_id).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add the member
    result = crud.add_project_member(db=db, project_id=project_id, user_id=member.user_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add member"
        )
    
    return {
        "message": f"User {user_to_add.full_name} added to project successfully",
        "project_id": project_id,
        "user_id": member.user_id
    }


@app.delete("/projects/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Remove a member from a project (Protected Route - Requires Authentication & Lead Role).
    Only the project owner can remove members.
    
    Args:
        project_id: ID of the project
        user_id: ID of the user to remove
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Raises:
        HTTPException: If project not found or user is not owner
    """
    # RBAC: Only Team Leads can remove members
    if current_user.role != models.Role.lead:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a Team Lead can remove members from projects"
        )
    
    # Fetch the project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify the current user is the project owner
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can remove members"
        )
    
    # Prevent removing the owner
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the project owner from members"
        )
    
    # Remove the member
    crud.remove_project_member(db=db, project_id=project_id, user_id=user_id)
    return None


@app.patch("/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update a project (Protected Route - Requires Authentication & Owner Role).
    Only the project owner can update the project.
    
    Args:
        project_id: ID of the project
        project_update: ProjectUpdate schema with fields to update
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        Updated project
        
    Raises:
        HTTPException: If project not found or user is not owner
    """
    # Fetch the project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify the current user is the project owner
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can update the project"
        )
    
    # Update the project
    updated_project = crud.update_project(db=db, project_id=project_id, project_update=project_update)
    if not updated_project:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )
    
    return updated_project


@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete a project (Protected Route - Requires Authentication & Owner Role).
    Only the project owner can delete the project.
    Cascade will automatically delete all tasks and member associations.
    
    Args:
        project_id: ID of the project
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Raises:
        HTTPException: If project not found or user is not owner
    """
    # Fetch the project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Verify the current user is the project owner
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can delete the project"
        )
    
    # Delete the project
    success = crud.delete_project(db=db, project_id=project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )
    
    return None


# ==================== Task Endpoints ====================

@app.post("/projects/{project_id}/tasks/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new task within a project (Protected Route - Requires Authentication).
    User must be project owner or member.
    
    Args:
        project_id: ID of the parent project
        task: TaskCreate schema
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        Created task
        
    Raises:
        HTTPException: If project not found or user is not owner/member
    """
    # Verify the project exists
    project = db.query(models.Project).options(
        joinedload(models.Project.members)
    ).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user is owner or member
    is_owner = project.owner_id == current_user.id
    is_member = current_user in project.members
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add tasks to this project"
        )
    
    return crud.create_task(db=db, task=task, project_id=project_id)


@app.get("/projects/{project_id}/tasks/", response_model=list[schemas.TaskResponse])
def get_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all tasks for a specific project (Kanban board) (Protected Route - Requires Authentication).
    User must be project owner or member.
    
    Args:
        project_id: ID of the project
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        List of tasks
        
    Raises:
        HTTPException: If project not found or user is not owner/member
    """
    # Verify the project exists
    project = db.query(models.Project).options(
        joinedload(models.Project.members)
    ).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user is owner or member
    is_owner = project.owner_id == current_user.id
    is_member = current_user in project.members
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view tasks for this project"
        )
    
    return crud.get_tasks(db=db, project_id=project_id)


@app.patch("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Update task (supports partial updates) (Protected Route - Requires Authentication).
    Can update title, description, status, priority, and assignee_id.
    User must be project owner or member.
    
    Args:
        task_id: ID of the task to update
        task_update: TaskUpdate schema with fields to update
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Returns:
        Updated task
        
    Raises:
        HTTPException: If task not found or user is not owner/member
    """
    # Get the task and verify it exists
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify the task's project
    project = db.query(models.Project).options(
        joinedload(models.Project.members)
    ).filter(models.Project.id == db_task.project_id).first()
    
    # Check if user is owner or member
    is_owner = project.owner_id == current_user.id
    is_member = current_user in project.members
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this task"
        )
    
    # Update the task with provided fields
    updated_task = crud.update_task(db=db, task_id=task_id, task_update=task_update)
    return updated_task


@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Delete a task (Protected Route - Requires Authentication & Lead Role).
    
    Args:
        task_id: ID of the task to delete
        db: Database session (injected)
        current_user: Authenticated user from JWT token
        
    Raises:
        HTTPException: If task not found, user doesn't own the project, or user is not a Team Lead
    """
    # RBAC: Only Team Leads can delete tasks
    if current_user.role != models.Role.lead:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a Team Lead can delete tasks"
        )
    
    # Get the task and verify it exists
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Verify the task's project belongs to the current user
    project = db.query(models.Project).options(
        joinedload(models.Project.members)
    ).filter(models.Project.id == db_task.project_id).first()
    
    # Only project owner can delete tasks (not members)
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can delete tasks"
        )
    
    # Delete the task
    crud.delete_task(db=db, task_id=task_id)
    return None


# ==================== Development Server ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

