"""
Database configuration and connection setup for SQLAlchemy.
Handles PostgreSQL connection via Supabase with proper session management.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment variable
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/dbname"  # Fallback for development
)

# Create SQLAlchemy engine
# pool_pre_ping=True: Enables connection health checks before using connections from the pool
# This is critical for cloud databases like Supabase to prevent stale connection errors
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Prevents connection drops with cloud-hosted databases
)

# SessionLocal: Factory for creating new database sessions
# autocommit=False: Requires explicit commit() calls (safer for transactions)
# autoflush=False: Prevents automatic flushing before queries (more predictable behavior)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for SQLAlchemy models
# All database models will inherit from this class
Base = declarative_base()


# Dependency function for FastAPI routes
# Yields a database session and ensures it's closed after use
def get_db():
    """
    Database session dependency for FastAPI.
    
    Yields:
        Session: SQLAlchemy database session
        
    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


