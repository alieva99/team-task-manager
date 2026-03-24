from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class NoteBase(BaseModel):
    task_id: int
    content: Dict[str, Any]

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    content: Optional[Dict[str, Any]] = None

class NoteResponse(NoteBase):
    noted_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[Dict[str, Any]] = None  # Добавляем информацию о пользователе
    
    class Config:
        from_attributes = True