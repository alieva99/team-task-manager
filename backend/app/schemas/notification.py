from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    user_id: int
    task_id: Optional[int] = None
    expires_at: Optional[datetime] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationResponse(NotificationBase):
    notification_id: int
    user_id: int
    task_id: Optional[int]
    is_read: bool
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TaskInfo(BaseModel):
    task_id: int
    title: str
    project_id: int
    project_name: Optional[str] = None

class NotificationWithTaskResponse(NotificationResponse):
    task_info: Optional[TaskInfo] = None