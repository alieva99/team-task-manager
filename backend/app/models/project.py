from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Project(Base):
    __tablename__ = "projects"
    
    project_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    project_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    creator = relationship("User", back_populates="created_projects", foreign_keys=[created_by])
    members = relationship("ProjectUser", back_populates="project", cascade="all, delete-orphan")
    columns = relationship("ColumnModel", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project")

class ColumnModel(Base):
    __tablename__ = "columns"
    
    column_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"))
    column_name = Column(String(255), nullable=False)
    order_index_column = Column(Integer, default=0)
    
    project = relationship("Project", back_populates="columns")
    tasks = relationship("Task", back_populates="column", cascade="all, delete-orphan")