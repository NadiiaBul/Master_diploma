from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class User(Base):
    __tablename__ = "Users"

    UserID = Column(Integer, primary_key=True, autoincrement=True)
    Username = Column(String(100), unique=True, nullable=False)
    PasswordHash = Column(String(255), nullable=False)
    CreatedAt = Column(DateTime, default=datetime.now)
    LastLogin = Column(DateTime)
    RoleID = Column(Integer, ForeignKey("Roles.RoleID"), nullable=False)

    logs = relationship("RecognitionLog", back_populates="user")
    role = relationship("Role", backref="users")