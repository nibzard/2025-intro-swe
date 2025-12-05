from pydantic import BaseModel
from typing import Optional

class ProducerBase(BaseModel):
    name: str
    signature_sound: Optional[str] = None
    image_url: Optional[str] = None
    biography: Optional[str] = None
    fun_facts: Optional[str] = None
    production_techniques: Optional[str] = None
    notable_albums: Optional[str] = None

class ProducerCreate(ProducerBase):
    pass

class Producer(ProducerBase):
    id: int

    class Config:
        from_attributes = True