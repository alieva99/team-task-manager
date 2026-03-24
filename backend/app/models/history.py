from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class History(Base):
    __tablename__ = "histories"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action_name = Column(String(50), nullable=False)  # ← вместо action_id
    task_user_id = Column(Integer, ForeignKey("users.user_id"))
    content = Column(JSONB, nullable=False)
    history_updated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связь с пользователем
    user = relationship("User", foreign_keys=[task_user_id])

    # Индексы
    __table_args__ = (
        Index('ix_histories_task_user_id', task_user_id),
        Index('ix_histories_history_updated_at', history_updated_at),
        Index('ix_histories_action_name', action_name),  # ← новый индекс
    )

class Action(Base):
    __tablename__ = "actions"
    
    action_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    action_name = Column(String(50), nullable=False)