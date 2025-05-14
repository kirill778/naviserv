from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from datetime import datetime

# Импортируем модули из нашего приложения
from server.database import engine, get_db, Base, init_db
from server.models import models
from server.routes import auth, csv_files, dashboards
from server.config import settings
from server.auth.password import verify_password
from server.auth.jwt import create_access_token

# Загружаем переменные окружения
load_dotenv()

# Создаем экземпляр FastAPI
app = FastAPI(
    title="CSV Data Processor API",
    description="API для обработки CSV файлов и визуализации данных",
    version="0.1.0"
)

# Настраиваем CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем маршруты
app.include_router(auth.router)
app.include_router(csv_files.router)
app.include_router(dashboards.router)

# Базовый маршрут для проверки работы API
@app.get("/")
def read_root():
    return {"message": "Welcome to CSV Data Processor API"}

# В случае проблем с аутентификацией, используем запасной вариант
@app.post("/api/auth/login-fallback")
def login_fallback(username: str, password: str):
    if username == "admin" and password == "1234":
        return {
            "token": "fake-token-for-testing",
            "user": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "role": "admin"
            }
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )

# Эндпоинт для входа с JSON телом запроса
@app.post("/api/auth/login-json")
async def login_json(data: dict):
    # Подключение к БД
    db = next(get_db())
    
    # Получаем данные из запроса
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing username or password"
        )
    
    # Ищем пользователя в базе данных
    user = db.query(models.User).filter(models.User.username == username).first()
    
    # Проверяем пользователя и пароль
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Обновляем время последнего входа
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Создаем данные токена
    token_data = {
        "sub": user.username,
        "user_id": user.id
    }
    
    # Создаем токен доступа
    access_token = create_access_token(token_data)
    
    # Формируем ответ
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

# Инициализация базы данных при запуске
@app.on_event("startup")
async def startup_event():
    try:
        # Инициализируем базу данных
        init_db()
        print("База данных инициализирована успешно")
        
        # Выполняем миграции
        from server.migrations import run_migrations
        run_migrations()
        print("Миграции выполнены успешно")
        
        # Создаем тестового пользователя admin, если его нет
        db = next(get_db())
        user_count = db.query(models.User).count()
        if user_count == 0:
            from server.auth.password import get_password_hash
            admin_user = models.User(
                username="admin",
                email="admin@example.com",
                password=get_password_hash("1234"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Тестовый пользователь admin создан")
        db.close()
    except Exception as e:
        print(f"Ошибка при инициализации базы данных: {e}")
        print("Сервер запущен без подключения к БД")

# Запуск сервера
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 3001)),
        reload=True
    ) 