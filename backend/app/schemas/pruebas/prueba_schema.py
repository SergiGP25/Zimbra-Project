from pydantic import BaseModel, Field


class PruebaCreate(BaseModel):
    prospecto_id: int = Field(..., gt=0)
    producto_id: int = Field(..., gt=0)
