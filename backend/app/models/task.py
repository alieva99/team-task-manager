from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Optional, Dict, Any
from ..core.database import Base

class Priority(Base):
    __tablename__ = "priorities"
    
    priority_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    priority_name = Column(String(50), nullable=False)
    color = Column(String(7), default="#808080")

class Task(Base):
    __tablename__ = "tasks"
    
    task_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"))
    column_id = Column(Integer, ForeignKey("columns.column_id"))
    priority_id = Column(Integer, ForeignKey("priorities.priority_id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("tasks.task_id"), nullable=True)
    task_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Создатель задачи
    assignee_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Исполнитель
    
    title = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    focus_time = Column(Integer, default=0, nullable=True)
    is_completed = Column(Boolean, default=False)
    estimated_time = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    order_index_task = Column(Integer, default=0)
    custom_fields = Column(JSON, nullable=True)
    
    # Связи
    project = relationship("Project", back_populates="tasks")
    column = relationship("ColumnModel", back_populates="tasks")
    priority = relationship("Priority")
    creator = relationship("User", foreign_keys=[task_user_id])
    assignee = relationship("User", foreign_keys=[assignee_id])  # ← ИСПРАВЛЕНО: ссылается на User, а не ProjectUser
    
    parent = relationship("Task", remote_side=[task_id], backref="subtasks")
    notes = relationship("Note", back_populates="task", cascade="all, delete-orphan")
    
    notifications = relationship("Notification", back_populates="task", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразует задачу в словарь для сериализации"""
        return {
            'task_id': self.task_id,
            'project_id': self.project_id,
            'column_id': self.column_id,
            'title': self.title,
            'description': self.description,
            'priority_id': self.priority_id,
            'parent_id': self.parent_id,
            'task_user_id': self.task_user_id,
            'assignee_id': self.assignee_id,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'estimated_time': self.estimated_time.isoformat() if self.estimated_time else None,
            'focus_time': self.focus_time,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'order_index_task': self.order_index_task,
            'custom_fields': self.custom_fields
        }
    
    def __repr__(self):
        return f"<Task {self.task_id}: {self.title}>"