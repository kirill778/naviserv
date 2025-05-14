from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import shutil
import csv
from pydantic import BaseModel
from server.models import models
from server.database import get_db
from server.auth.jwt import get_current_active_user
from server.config.settings import settings

router = APIRouter(
    prefix=f"{settings.API_PREFIX}/csv-files",
    tags=["csv-files"],
    responses={401: {"description": "Unauthorized"}},
)

# Схемы данных для API
class CsvFileResponse(BaseModel):
    id: int
    name: str
    original_name: str
    size: int
    mime_type: str
    column_headers: List[str]
    row_count: int
    processed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/upload", response_model=CsvFileResponse)
async def upload_csv_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Загрузка CSV файла"""
    # Проверяем тип файла
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    # Создаем директорию для файлов, если она не существует
    upload_dir = os.path.join("uploads", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Создаем уникальное имя файла
    file_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(upload_dir, file_name)
    
    # Сохраняем файл на диске
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Получаем информацию о файле
    column_headers = []
    row_count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.reader(csv_file)
            column_headers = next(csv_reader, [])  # Получаем заголовки столбцов
            row_count = sum(1 for _ in csv_reader)  # Считаем количество строк
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CSV file: {str(e)}"
        )
    
    # Создаем запись о файле в базе данных
    csv_file_db = models.CsvFile(
        name=file_name,
        original_name=file.filename,
        path=file_path,
        size=os.path.getsize(file_path),
        mime_type=file.content_type or "text/csv",
        user_id=current_user.id,
        column_headers=column_headers,
        row_count=row_count,
        processed_at=datetime.utcnow()
    )
    
    # Сохраняем в базу данных
    db.add(csv_file_db)
    db.commit()
    db.refresh(csv_file_db)
    
    return csv_file_db

@router.get("/", response_model=List[CsvFileResponse])
def get_user_csv_files(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """Получение списка CSV файлов пользователя"""
    files = db.query(models.CsvFile).filter(
        models.CsvFile.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return files

@router.get("/{file_id}", response_model=CsvFileResponse)
def get_csv_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получение информации о конкретном CSV файле"""
    file = db.query(models.CsvFile).filter(
        models.CsvFile.id == file_id,
        models.CsvFile.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CSV file not found"
        )
    
    return file

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_csv_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Удаление CSV файла"""
    file = db.query(models.CsvFile).filter(
        models.CsvFile.id == file_id,
        models.CsvFile.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CSV file not found"
        )
    
    # Удаляем файл с диска
    try:
        if os.path.exists(file.path):
            os.remove(file.path)
    except Exception as e:
        pass  # Игнорируем ошибки при удалении файла
    
    # Удаляем запись из базы данных
    db.delete(file)
    db.commit()
    
    return None 