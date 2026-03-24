from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.task_id", ondelete="CASCADE"), nullable=True)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    data = Column(JSON, nullable=True)
    
    # Связи
    user = relationship("User", back_populates="notifications")
    task = relationship("Task", back_populates="notifications")
    
    # Индексы
    __table_args__ = (
        Index('ix_notifications_user_id', user_id),
        Index('ix_notifications_is_read', is_read),
        Index('ix_notifications_created_at', created_at),
    )