from sqlalchemy import Column, Integer, String
from db import Base

class AircraftType(Base):
    __tablename__ = "AircraftTypes"

    AircraftTypeID = Column(Integer, primary_key=True, autoincrement=True)
    AircraftName = Column(String(50), nullable=False)
    Description = Column(String(300))