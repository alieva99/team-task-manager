from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    column_id: int
    priority_id: Optional[int] = None
    parent_id: Optional[int] = None
    task_user_id: Optional[int] = None
    assignee_id: Optional[int] = None  # Один исполнитель
    deadline: Optional[datetime] = None
    estimated_time: Optional[datetime] = None
    focus_time: Optional[int] = 0
    is_completed: Optional[bool] = False

class TaskCreate(TaskBase):
    project_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column_id: Optional[int] = None
    priority_id: Optional[int] = None
    task_user_id: Optional[int] = None
    assignee_id: Optional[int] = None  # Один исполнитель
    deadline: Optional[datetime] = None
    order_index_task: Optional[int] = None
    focus_time: Optional[int] = None
    is_completed: Optional[bool] = None

class TaskResponse(TaskBase):
    task_id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    order_index_task: int
    focus_time: int
    is_completed: bool
    assignee_id: Optional[int] = None  # Одно поле
    
    model_config = ConfigDict(from_attributes=True)