from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from server.config.settings import settings

# Создаем движок SQLAlchemy для PostgreSQL
engine = create_engine(settings.DATABASE_URL)

# Создаем фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей SQLAlchemy
Base = declarative_base()

# Функция для получения экземпляра сессии базы данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Функция для инициализации базы данных
def init_db():
    # Импортируем модели, чтобы они были доступны для создания таблиц
    from server.models import models
    
    # Создаем таблицы в базе данных
    Base.metadata.create_all(bind=engine) 