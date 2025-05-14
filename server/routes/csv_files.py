from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import shutil
import csv
import json
import io
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

# Схема для сохранения содержимого таблицы
class SpreadsheetDataRequest(BaseModel):
    data: List[List[Any]]
    headers: List[str]
    name: Optional[str] = None  # Необязательное имя файла

    class Config:
        json_schema_extra = {
            "example": {
                "data": [["value1", "value2"], ["value3", "value4"]],
                "headers": ["Column1", "Column2"],
                "name": "example_file.csv"
            }
        }
        arbitrary_types_allowed = True

# Схема для обновления существующего файла
class UpdateCsvFileRequest(BaseModel):
    data: List[List[Any]]
    headers: List[str]

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

@router.post("/save", response_model=CsvFileResponse)
async def save_spreadsheet_data(
    request: SpreadsheetDataRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Сохранение данных электронной таблицы в новый файл"""
    print("POST /save endpoint hit with data")
    try:
        # Создаем имя файла
        file_name = request.name if request.name else f"spreadsheet_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
        # Проверка и добавление расширения .csv если отсутствует
        if not file_name.lower().endswith('.csv'):
            file_name += '.csv'
        
        # Определяем количество строк и оценочный размер данных
        # Подсчитываем только непустые строки
        filtered_data = [row for row in request.data if any(cell is not None and cell != '' for cell in row)]
        row_count = len(filtered_data)
        
        # Оценка размера данных (приблизительно)
        size_estimate = 0
        for row in filtered_data:
            for cell in row:
                if cell is not None:
                    size_estimate += len(str(cell)) + 1  # +1 для разделителя
        
        # Добавляем размер заголовков
        for header in request.headers:
            size_estimate += len(header) + 1
        
        # Создаем директорию для файлов, если она не существует
        upload_dir = os.path.join("uploads", str(current_user.id))
        os.makedirs(upload_dir, exist_ok=True)
        
        # Создаем путь к файлу
        file_path = os.path.join(upload_dir, file_name)
        
        # Сохраняем данные в CSV файл
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            # Записываем заголовки
            csv_writer.writerow(request.headers)
            # Записываем данные
            csv_writer.writerows(filtered_data)
        
        # Создаем запись о файле в базе данных (не используя атрибут data)
        csv_file_db = models.CsvFile(
            name=file_name,
            original_name=file_name,
            path=file_path,
            size=os.path.getsize(file_path),
            mime_type="text/csv",
            user_id=current_user.id,
            column_headers=request.headers,
            row_count=row_count,
            processed_at=datetime.utcnow()
        )
        
        # Сохраняем в базу данных
        db.add(csv_file_db)
        db.commit()
        db.refresh(csv_file_db)
        print(f"File saved successfully with ID: {csv_file_db.id}")
        
        return csv_file_db
    
    except Exception as e:
        print(f"Error saving spreadsheet data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving spreadsheet data: {str(e)}"
        )

@router.put("/{file_id}", response_model=CsvFileResponse)
async def update_csv_file(
    file_id: int,
    request: UpdateCsvFileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Обновление существующего CSV файла"""
    # Находим файл в базе данных
    file = db.query(models.CsvFile).filter(
        models.CsvFile.id == file_id,
        models.CsvFile.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CSV file not found"
        )
    
    try:
        # Отфильтруем только непустые строки для сохранения
        filtered_data = [row for row in request.data if any(cell is not None and cell != '' for cell in row)]
        
        # Если у файла нет пути или он не существует, создадим новый путь
        if not file.path or not os.path.exists(file.path):
            # Создаем директорию для файлов, если она не существует
            upload_dir = os.path.join("uploads", str(current_user.id))
            os.makedirs(upload_dir, exist_ok=True)
            
            # Если нет имени файла, создаем его
            file_name = file.name if file.name else f"spreadsheet_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
            # Проверка и добавление расширения .csv если отсутствует
            if not file_name.lower().endswith('.csv'):
                file_name += '.csv'
                
            file.path = os.path.join(upload_dir, file_name)
        
        # Сохраняем данные в CSV файл
        with open(file.path, 'w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            # Записываем заголовки
            csv_writer.writerow(request.headers)
            # Записываем данные
            csv_writer.writerows(filtered_data)
        
        # Обновляем информацию о файле
        file.column_headers = request.headers
        file.row_count = len(filtered_data)
        file.size = os.path.getsize(file.path)
        file.processed_at = datetime.utcnow()
        
        # Сохраняем изменения в базе данных
        db.commit()
        db.refresh(file)
        
        return file
        
    except Exception as e:
        print(f"Error updating CSV file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating CSV file: {str(e)}"
        )

@router.get("/content/{file_id}")
def get_csv_file_content(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получение содержимого CSV файла"""
    file = db.query(models.CsvFile).filter(
        models.CsvFile.id == file_id,
        models.CsvFile.user_id == current_user.id
    ).first()
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CSV file not found"
        )
    
    try:
        # Если есть путь к файлу, попробуем прочитать файл
        if file.path and os.path.exists(file.path):
            data = []
            try:
                with open(file.path, 'r', encoding='utf-8') as csvfile:
                    csv_reader = csv.reader(csvfile)
                    # Пропускаем заголовки, они уже есть в file.column_headers
                    next(csv_reader, None)
                    # Читаем данные
                    for row in csv_reader:
                        data.append(row)
                
                return {
                    "headers": file.column_headers,
                    "data": data
                }
            except Exception as e:
                print(f"Error reading CSV file from disk: {str(e)}")
        
        # Если файла нет или не удалось прочитать, возвращаем пустой массив с заголовками
        return {
            "headers": file.column_headers,
            "data": []
        }
    
    except Exception as e:
        print(f"Error retrieving CSV content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving CSV content: {str(e)}"
        )

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
    
    # Если есть физический файл, удаляем его
    if file.path and os.path.exists(file.path):
        try:
            os.remove(file.path)
        except Exception as e:
            print(f"Warning: Could not remove file {file.path}: {str(e)}")
    
    # Удаляем запись из базы данных
    db.delete(file)
    db.commit()
    
    return None 