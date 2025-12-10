from sqlalchemy import Column, String
from db import Base

class SystemSettings(Base):
    __tablename__ = "System_Settings"

    SettingKey = Column(String(100), primary_key=True)
    SettingValue = Column(String(255), nullable=False)