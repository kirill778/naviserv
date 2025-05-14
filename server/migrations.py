from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, ARRAY, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import json
from sqlalchemy.sql import text

from server.config.settings import settings

# Подключение к базе данных
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = SessionLocal()

def run_migrations():
    print("Running database migrations...")
    
    # Проверяем наличие колонки data в таблице csv_files
    try:
        session.execute(text("SELECT data FROM csv_files LIMIT 1"))
        print("Column 'data' already exists in the csv_files table")
    except Exception as e:
        if "column csv_files.data does not exist" in str(e) or "no such column: data" in str(e):
            print("Adding 'data' column to csv_files table...")
            
            # Добавляем колонку data
            if "postgresql" in settings.DATABASE_URL:
                # PostgreSQL синтаксис
                session.execute(text("ALTER TABLE csv_files ADD COLUMN IF NOT EXISTS data JSONB"))
            else:
                # SQLite синтаксис
                session.execute(text("ALTER TABLE csv_files ADD COLUMN data JSON"))
            
            # Обновляем существующие записи
            # Для каждого файла пытаемся прочитать его содержимое и сохранить в новую колонку
            print("Migrating existing CSV files to new data format...")
            
            # Получаем список всех CSV файлов
            session.execute(text("COMMIT")) # Commit the previous transaction
            result = session.execute(text("SELECT id, path, column_headers FROM csv_files"))
            files = result.fetchall()

            for file in files:
                file_id, file_path, headers = file
                if not file_path or not os.path.exists(file_path):
                    continue
                
                try:
                    data = []
                    with open(file_path, 'r', encoding='utf-8') as csvfile:
                        # Пропускаем первую строку (заголовки)
                        next(csvfile)
                        # Читаем остальное содержимое
                        import csv
                        csv_reader = csv.reader(csvfile)
                        for row in csv_reader:
                            data.append(row)
                    
                    # Обновляем запись в БД
                    session.execute(
                        text("UPDATE csv_files SET data = :data WHERE id = :id"),
                        {"data": json.dumps(data), "id": file_id}
                    )
                except Exception as file_error:
                    print(f"Error migrating file id {file_id}: {str(file_error)}")
            
            session.commit()
            print("Migration completed!")
        else:
            print(f"Unexpected error checking for 'data' column: {str(e)}")
    
    # Делаем колонку path опциональной
    try:
        # В SQLite нельзя изменить столбец из NOT NULL в NULL, но мы можем изменить колонку в PostgreSQL
        if "postgresql" in settings.DATABASE_URL:
            session.execute(text("ALTER TABLE csv_files ALTER COLUMN path DROP NOT NULL"))
            print("Made 'path' column nullable in PostgreSQL")
    except Exception as e:
        print(f"Note: Could not make 'path' column nullable: {str(e)}")
    
    print("Migrations complete.")

if __name__ == "__main__":
    run_migrations() 