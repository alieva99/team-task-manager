from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    project_name: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None

class ProjectResponse(ProjectBase):
    project_id: int
    created_by: int
    created_at: datetime
    # is_completed убран
    
    class Config:
        from_attributes = True

class ProjectWithColumnsResponse(ProjectResponse):
    columns: List['ColumnResponse'] = []
    
    class Config:
        from_attributes = True

# Импортируем для аннотаций
from .column import ColumnResponse
ProjectWithColumnsResponse.model_rebuild()