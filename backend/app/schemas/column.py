from pydantic import BaseModel
from typing import Optional

class ColumnBase(BaseModel):
    column_name: str
    order_index_column: Optional[int] = None

class ColumnCreate(ColumnBase):
    project_id: int  # Это поле обязательно

class ColumnUpdate(BaseModel):
    column_name: Optional[str] = None
    order_index_column: Optional[int] = None

class ColumnResponse(ColumnBase):
    column_id: int
    project_id: int
    
    class Config:
        from_attributes = True