from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    user_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    solution_name = Column(String(255), default="Моё решение")
    solution_icon = Column(String(50), default="Dashboard")
    solution_settings = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    created_projects = relationship("Project", back_populates="creator", foreign_keys="Project.created_by")
    project_memberships = relationship("ProjectUser", back_populates="user")
    
    # Задачи, где пользователь является создателем
    created_tasks = relationship("Task", foreign_keys="Task.task_user_id", back_populates="creator")

    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"
    
    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), nullable=False)