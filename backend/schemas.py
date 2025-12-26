"""
Pydantic schemas for request validation and response serialization.
Defines the data structures for API requests and responses.
"""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from models import Role, TaskStatus, Priority


# ==================== User Schemas ====================

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration request."""
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str
    role: Role


class UserResponse(UserBase):
    """Schema for user response (excludes password)."""
    id: int
    full_name: str
    role: Role
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Project Schemas ====================

class ProjectBase(BaseModel):
    """Base project schema with common fields."""
    title: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Schema for project creation request."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for project update request (all fields optional)."""
    title: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    """Schema for project response with member list."""
    id: int
    owner_id: int
    members: List[UserResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


class ProjectMemberCreate(BaseModel):
    """Schema for adding a member to a project."""
    user_id: int


# ==================== Task Schemas ====================

class TaskBase(BaseModel):
    """Base task schema with common fields."""
    title: str
    description: Optional[str] = None
    priority: Priority
    status: TaskStatus


class TaskCreate(TaskBase):
    """Schema for task creation request."""
    assignee_id: Optional[int] = None


class TaskUpdate(BaseModel):
    """Schema for task update request (all fields optional for partial updates)."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    assignee_id: Optional[int] = None


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: int
    project_id: int
    assignee_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


# ==================== Authentication Schemas ====================

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for decoded JWT token data."""
    username: Optional[str] = None

