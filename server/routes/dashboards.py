from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from server.models import models
from server.database import get_db
from server.auth.jwt import get_current_active_user
from server.config.settings import settings

router = APIRouter(
    prefix=f"{settings.API_PREFIX}/dashboards",
    tags=["dashboards"],
    responses={401: {"description": "Unauthorized"}},
)

# Схемы данных для API
class DashboardBase(BaseModel):
    name: str
    description: Optional[str] = None
    layout: list
    is_public: bool = False

class DashboardCreate(DashboardBase):
    pass

class DashboardUpdate(DashboardBase):
    pass

class DashboardResponse(DashboardBase):
    id: int
    user_id: int
    last_edited: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/", response_model=DashboardResponse)
def create_dashboard(
    dashboard: DashboardCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Создание нового дашборда"""
    db_dashboard = models.Dashboard(
        **dashboard.dict(),
        user_id=current_user.id
    )
    
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    
    return db_dashboard

@router.get("/", response_model=List[DashboardResponse])
def get_dashboards(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """Получение списка дашбордов пользователя"""
    dashboards = db.query(models.Dashboard).filter(
        models.Dashboard.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return dashboards

@router.get("/public", response_model=List[DashboardResponse])
def get_public_dashboards(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Получение списка публичных дашбордов"""
    dashboards = db.query(models.Dashboard).filter(
        models.Dashboard.is_public == True
    ).offset(skip).limit(limit).all()
    
    return dashboards

@router.get("/{dashboard_id}", response_model=DashboardResponse)
def get_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Получение конкретного дашборда"""
    # Сначала проверяем, есть ли дашборд у текущего пользователя
    dashboard = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id,
        models.Dashboard.user_id == current_user.id
    ).first()
    
    # Если нет, проверяем, является ли дашборд публичным
    if not dashboard:
        dashboard = db.query(models.Dashboard).filter(
            models.Dashboard.id == dashboard_id,
            models.Dashboard.is_public == True
        ).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    
    return dashboard

@router.put("/{dashboard_id}", response_model=DashboardResponse)
def update_dashboard(
    dashboard_id: int,
    dashboard_update: DashboardUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Обновление дашборда"""
    db_dashboard = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id,
        models.Dashboard.user_id == current_user.id
    ).first()
    
    if not db_dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found or you don't have permission to edit it"
        )
    
    # Обновляем все поля дашборда
    for key, value in dashboard_update.dict().items():
        setattr(db_dashboard, key, value)
    
    # Обновляем время редактирования
    db_dashboard.last_edited = datetime.utcnow()
    
    db.commit()
    db.refresh(db_dashboard)
    
    return db_dashboard

@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Удаление дашборда"""
    db_dashboard = db.query(models.Dashboard).filter(
        models.Dashboard.id == dashboard_id,
        models.Dashboard.user_id == current_user.id
    ).first()
    
    if not db_dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found or you don't have permission to delete it"
        )
    
    db.delete(db_dashboard)
    db.commit()
    
    return None 