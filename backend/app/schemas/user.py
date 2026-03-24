from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    user_name: str = Field(..., min_length=1, max_length=255)
    solution_name: Optional[str] = "Моё решение"
    solution_icon: Optional[str] = "Dashboard"
    solution_settings: Optional[Dict[str, Any]] = {}

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    user_id: int
    created_at: Optional[datetime]
    solution_name: str
    solution_icon: str
    solution_settings: Dict[str, Any]
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    user_name: Optional[str] = None
    email: Optional[EmailStr] = None
    solution_name: Optional[str] = None
    solution_icon: Optional[str] = None
    solution_settings: Optional[Dict[str, Any]] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None