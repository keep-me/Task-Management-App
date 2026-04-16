from pydantic import BaseModel, Field, constr, validator
from typing import Optional, List
from datetime import date, datetime

class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    category: Optional[str] = None
    task_title: str = Field(..., min_length=1)
    task_description: Optional[str] = None
    priority: constr(pattern="^(High|Medium|Low)$") = Field(...)
    labels: Optional[List[str]] = []
    is_public: Optional[bool] = False

class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    task_title: Optional[str] = None
    task_description: Optional[str] = None
    priority: Optional[str] = None
    labels: Optional[List[str]] = None
    is_public: Optional[bool] = None

class TemplateCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

class TemplateCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TaskFromTemplateCreate(BaseModel):
    deadline: datetime
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    assignee: Optional[str] = None

    @validator('deadline', pre=True)
    def convert_deadline_to_datetime(cls, v):
        """Convert date to datetime at midnight for MongoDB compatibility"""
        if isinstance(v, datetime):
            return v
        elif isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        elif isinstance(v, str):
            try:
                return datetime.fromisoformat(v)
            except ValueError:
                date_obj = datetime.fromisoformat(v).date()
                return datetime.combine(date_obj, datetime.min.time())
        else:
            raise ValueError(f"Invalid deadline type: {type(v)}. Expected datetime or string in YYYY-MM-DD format.")
