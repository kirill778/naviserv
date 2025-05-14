import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from passlib.context import CryptContext

# Загружаем переменные окружения
load_dotenv()

# Настраиваем хеширование паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Создаем подключение к базе данных
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "csv_processor")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Создаем хеш пароля
password = "1234"
hashed_password = pwd_context.hash(password)

print(f"Новый хеш пароля: {hashed_password}")

# Создаем подключение к базе данных
engine = create_engine(DATABASE_URL)

# Обновляем пароль для пользователя admin
with engine.connect() as conn:
    result = conn.execute(
        text("UPDATE users SET password = :password WHERE username = 'admin'"),
        {"password": hashed_password}
    )
    conn.commit()
    
    # Проверяем, что пароль обновлен
    user = conn.execute(
        text("SELECT * FROM users WHERE username = 'admin'")
    ).fetchone()
    
    if user:
        print(f"Пароль для пользователя admin обновлен успешно")
        print(f"ID: {user[0]}, Имя: {user[1]}, Email: {user[2]}")
    else:
        print("Пользователь admin не найден") 