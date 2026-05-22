from pydantic import BaseModel
from typing import List, Optional

class Profile(BaseModel):
    user_id: int
    title: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    skills: List[str] = []
