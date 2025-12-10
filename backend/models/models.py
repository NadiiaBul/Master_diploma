from sqlalchemy import Column, Integer, String
from db import Base

class Model(Base):
    __tablename__ = "Models"

    ModelID = Column(Integer, primary_key=True, autoincrement=True)
    ModelName = Column(String(100), nullable=False)
    Description = Column(String(300))
    IsActive = Column(Integer, default=1)