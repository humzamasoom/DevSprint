"""
SQLAlchemy models for DevSprint Kanban Board.
Defines User, Project, and Task tables with proper relationships.
"""

import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Text, Boolean, Table
from sqlalchemy.orm import relationship
from database import Base


# Association Table for Many-to-Many relationship between Users and Projects
# ondelete='CASCADE': Automatically removes membership records when user/project is deleted
project_members = Table(
    'project_members',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('project_id', Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
)


# Enum Definitions
class Role(str, enum.Enum):
    """User role enumeration for access control."""
    lead = "lead"
    dev = "dev"


class TaskStatus(str, enum.Enum):
    """Task status enumeration for Kanban board columns."""
    todo = "todo"
    inprogress = "inprogress"
    done = "done"


class Priority(str, enum.Enum):
    """Task priority enumeration."""
    low = "low"
    medium = "medium"
    high = "high"


# SQLAlchemy Models
class User(Base):
    """
    User model for authentication and task assignment.
    Represents developers and project leads in the system.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(Role), default=Role.dev)

    # Relationships
    owned_projects = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    assigned_tasks = relationship("Task", back_populates="assignee")
    joined_projects = relationship("Project", secondary=project_members, back_populates="members")


class Project(Base):
    """
    Project model representing a collection of tasks.
    Each project has an owner and contains multiple tasks.
    Projects can have multiple members (many-to-many relationship with users).
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    owner = relationship("User", back_populates="owned_projects", foreign_keys=[owner_id])
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    members = relationship("User", secondary=project_members, back_populates="joined_projects")


class Task(Base):
    """
    Task model representing individual work items in the Kanban board.
    Tasks belong to a project and can be assigned to users.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    priority = Column(Enum(Priority), default=Priority.medium)
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")

