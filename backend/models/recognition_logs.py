from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class RecognitionLog(Base):
    __tablename__ = "Recognition_Logs"

    LogID = Column(Integer, primary_key=True, autoincrement=True)

    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    AircraftTypeID = Column(Integer, ForeignKey("AircraftTypes.AircraftTypeID"), nullable=False)

    Confidence = Column(Float, nullable=False)
    SourceType = Column(String(10), nullable=False)  # 'file' or 'realtime'
    ProcessingTimeMs = Column(Integer, nullable=False)
    CreatedAt = Column(DateTime, default=datetime.now)

    # --- relationships
    user = relationship("User", back_populates="logs")