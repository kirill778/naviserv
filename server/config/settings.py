import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Загружаем переменные окружения
load_dotenv()

class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Настройки базы данных
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "csv_processor")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    
    # Строка подключения к базе данных
    DATABASE_URL: str = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Настройки JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-for-jwt-tokens")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 24 * 60  # 24 часа
    
    # Настройки сервера
    API_PREFIX: str = "/api"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Создаем экземпляр настроек
settings = Settings() 