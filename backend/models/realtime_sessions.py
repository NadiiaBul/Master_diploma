from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from db import Base

class RealtimeSession(Base):
    __tablename__ = "RealtimeSessions"

    SessionID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    ModelID = Column(Integer, ForeignKey("Models.ModelID"), nullable=False)
    StartTime = Column(DateTime, server_default=func.now())
    EndTime = Column(DateTime)
    DurationSeconds = Column(Integer)
    Status = Column(String(20), nullable=False, default="running")