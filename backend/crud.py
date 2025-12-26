"""
CRUD operations (Business Logic & Database Queries).
Handles all database interactions using the Service-Repository pattern.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_
from passlib.context import CryptContext
from fastapi import HTTPException, status
import models
import schemas

# Password hashing configuration using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==================== Password Utility Functions ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password from login
        hashed_password: The hashed password from database
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


# ==================== User Functions ====================

def get_user_by_email(db: Session, email: str) -> models.User | None:
    """
    Retrieve a user by their email address.
    
    Args:
        db: Database session
        email: User's email address
        
    Returns:
        User model instance or None if not found
    """
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    Create a new user with hashed password.
    
    Args:
        db: Database session
        user: UserCreate schema with plain password
        
    Returns:
        Created User model instance
    """
    # CRITICAL: Hash the password before storing
    hashed_password = get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> models.User | bool:
    """
    Authenticate a user by email and password.
    
    Args:
        db: Database session
        email: User's email address
        password: Plain text password from login
        
    Returns:
        User model instance if authentication successful, False otherwise
    """
    user = get_user_by_email(db, email=email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_all_users(db: Session) -> list[models.User]:
    """
    Retrieve all users (for task assignment dropdown in UI).
    
    Args:
        db: Database session
        
    Returns:
        List of all User model instances (passwords excluded in response schema)
    """
    return db.query(models.User).all()


# ==================== Project Functions ====================

def get_projects(db: Session, user_id: int) -> list[models.Project]:
    """
    Retrieve all projects where user is owner OR member.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        List of Project model instances (owned or joined)
    """
    return db.query(models.Project).filter(
        or_(
            models.Project.owner_id == user_id,
            models.Project.members.any(id=user_id)
        )
    ).all()


def get_project(db: Session, project_id: int) -> models.Project | None:
    """
    Retrieve a single project by ID.
    
    Args:
        db: Database session
        project_id: ID of the project
        
    Returns:
        Project model instance or None if not found
    """
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def create_project(db: Session, project: schemas.ProjectCreate, user_id: int) -> models.Project:
    """
    Create a new project linked to the owner.
    Automatically adds the owner as a member.
    
    Args:
        db: Database session
        project: ProjectCreate schema
        user_id: ID of the project owner
        
    Returns:
        Created Project model instance
    """
    db_project = models.Project(
        title=project.title,
        description=project.description,
        owner_id=user_id
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Automatically add the owner as a member
    owner = db.query(models.User).filter(models.User.id == user_id).first()
    if owner:
        db_project.members.append(owner)
        db.commit()
        db.refresh(db_project)
    
    return db_project


def add_project_member(db: Session, project_id: int, user_id: int) -> models.Project | None:
    """
    Add a user as a member to a project.
    
    Args:
        db: Database session
        project_id: ID of the project
        user_id: ID of the user to add as member
        
    Returns:
        Updated Project model instance or None if project/user not found
    """
    # Fetch the project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return None
    
    # Fetch the user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    
    # Check if user is already a member
    if user not in project.members:
        project.members.append(user)
        db.commit()
        db.refresh(project)
    
    return project


def remove_project_member(db: Session, project_id: int, user_id: int) -> models.Project | None:
    """
    Remove a user from project membership.
    Automatically unassigns all their tasks in this project to prevent ghost assignments.
    
    Args:
        db: Database session
        project_id: ID of the project
        user_id: ID of the user to remove
        
    Returns:
        Updated Project model instance or None if project not found
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return None
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user in project.members:
        # Unassign all tasks assigned to this user in this project
        tasks_to_unassign = db.query(models.Task).filter(
            models.Task.project_id == project_id,
            models.Task.assignee_id == user_id
        ).all()
        
        for task in tasks_to_unassign:
            task.assignee_id = None
        
        # Remove the user from project members
        project.members.remove(user)
        db.commit()
        db.refresh(project)
    
    return project


def update_project(db: Session, project_id: int, project_update: schemas.ProjectUpdate) -> models.Project | None:
    """
    Update a project's details.
    
    Args:
        db: Database session
        project_id: ID of the project to update
        project_update: ProjectUpdate schema with fields to update
        
    Returns:
        Updated Project model instance or None if project not found
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return None
    
    # Update only fields that were provided
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> bool:
    """
    Delete a project and all its associated data.
    Cascade will automatically delete tasks and remove member associations.
    
    Args:
        db: Database session
        project_id: ID of the project to delete
        
    Returns:
        True if deleted successfully, False if project not found
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return False
    
    db.delete(project)
    db.commit()
    return True


# ==================== Task Functions ====================

def get_tasks(db: Session, project_id: int) -> list[models.Task]:
    """
    Retrieve all tasks for a specific project.
    
    Args:
        db: Database session
        project_id: ID of the project
        
    Returns:
        List of Task model instances
    """
    return db.query(models.Task).filter(models.Task.project_id == project_id).all()


def create_task(db: Session, task: schemas.TaskCreate, project_id: int) -> models.Task:
    """
    Create a new task within a project.
    Validates assignee membership if assignee_id is provided.
    
    Args:
        db: Database session
        task: TaskCreate schema
        project_id: ID of the parent project
        
    Returns:
        Created Task model instance
        
    Raises:
        HTTPException: If assignee is not a member of the project
    """
    # Validate assignee membership if assignee_id is provided
    if task.assignee_id is not None:
        project = db.query(models.Project).filter(models.Project.id == project_id).first()
        
        if project:
            # Check if assignee is owner or member
            is_owner = project.owner_id == task.assignee_id
            is_member = any(member.id == task.assignee_id for member in project.members)
            
            if not (is_owner or is_member):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignee must be a member of the project"
                )
    
    db_task = models.Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        project_id=project_id,
        assignee_id=task.assignee_id
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate) -> models.Task | None:
    """
    Update a task with any provided fields (partial update support).
    Supports updating title, description, status, priority, and assignee_id.
    Validates that assignee is a member of the project.
    
    Args:
        db: Database session
        task_id: ID of the task to update
        task_update: TaskUpdate schema with fields to update
        
    Returns:
        Updated Task model instance or None if not found
        
    Raises:
        HTTPException: If assignee is not a member of the project
    """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if not db_task:
        return None
    
    # Update only the fields that are provided (not None)
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Validate assignee membership if assignee_id is being updated
    if 'assignee_id' in update_data and update_data['assignee_id'] is not None:
        assignee_id = update_data['assignee_id']
        
        # Fetch the project
        project = db.query(models.Project).filter(models.Project.id == db_task.project_id).first()
        
        if project:
            # Check if assignee is owner or member
            is_owner = project.owner_id == assignee_id
            is_member = any(member.id == assignee_id for member in project.members)
            
            if not (is_owner or is_member):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignee must be a member of the project"
                )
    
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    """
    Delete a task from the database.
    
    Args:
        db: Database session
        task_id: ID of the task to delete
        
    Returns:
        True if task was deleted, False if not found
    """
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    
    return False

