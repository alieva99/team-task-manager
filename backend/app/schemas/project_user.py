from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectUserBase(BaseModel):
    project_id: int
    user_id: int
    role_id: Optional[int] = None

class ProjectUserCreate(ProjectUserBase):
    pass

class ProjectUserResponse(ProjectUserBase):
    project_user_id: int
    joined_at: datetime
    
    class Config:
        from_attributes = True