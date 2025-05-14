from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, ARRAY, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from server.database import Base

class RoleEnum(str, Enum):
    ADMIN = "admin"
    USER = "user"

class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    role = Column(String(10), default="user")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Отношения (связи с другими моделями)
    csv_files = relationship("CsvFile", back_populates="user")
    dashboards = relationship("Dashboard", back_populates="user")

class CsvFile(Base):
    """Модель CSV файла"""
    __tablename__ = "csv_files"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)
    size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    column_headers = Column(ARRAY(String), nullable=False, default=list)
    row_count = Column(Integer, nullable=False, default=0)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Отношения
    user = relationship("User", back_populates="csv_files")

class Dashboard(Base):
    """Модель дашборда"""
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    layout = Column(JSON, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)
    last_edited = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Отношения
    user = relationship("User", back_populates="dashboards") 