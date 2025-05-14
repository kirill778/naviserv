from sqlalchemy import create_engine, Column, JSON, MetaData, Table
from sqlalchemy.ext.declarative import declarative_base
import os

# Получаем параметры подключения к БД из переменных окружения
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "csv_processor")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

# Формируем строку подключения
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Создаем соединение с базой данных
engine = create_engine(DATABASE_URL)
meta = MetaData()

# Определение таблицы csv_files
csv_files = Table(
    'csv_files', meta,
    autoload_with=engine  # Это загрузит существующую схему таблицы
)

# Проверяем, есть ли уже колонка data
columns = [c.name for c in csv_files.columns]
if 'data' not in columns:
    print("Добавление колонки 'data' в таблицу csv_files...")
    
    # Используем raw SQL для добавления колонки JSON
    with engine.connect() as conn:
        conn.execute(f"ALTER TABLE csv_files ADD COLUMN IF NOT EXISTS data JSON NULL")
        conn.commit()
    
    print("Колонка 'data' успешно добавлена!")
else:
    print("Колонка 'data' уже существует в таблице csv_files.")

print("Обновление схемы базы данных завершено.") 