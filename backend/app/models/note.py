from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Note(Base):
    __tablename__ = "notes"
    
    noted_id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    task_user_id = Column(Integer, ForeignKey("users.user_id"))  # Добавляем поле
    content = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    task = relationship("Task", back_populates="notes")
    user = relationship("User", foreign_keys=[task_user_id])  # Связь с пользователем