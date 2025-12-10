from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from db import Base

class AudioFile(Base):
    __tablename__ = "Audio_Files"
    FileID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    FilePath = Column(String(500), nullable=False)
    OriginalName = Column(String(255))
    UploadedAt = Column(DateTime, server_default=func.now())