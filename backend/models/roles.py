from sqlalchemy import Column, Integer, String
from db import Base

class Role(Base):
    __tablename__ = "Roles"

    RoleID = Column(Integer, primary_key=True, autoincrement=True)
    RoleName = Column(String(50), nullable=False, unique=True)