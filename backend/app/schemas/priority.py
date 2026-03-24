from pydantic import BaseModel

class PriorityBase(BaseModel):
    priority_name: str
    color: str

class PriorityResponse(PriorityBase):
    priority_id: int
    
    class Config:
        from_attributes = True