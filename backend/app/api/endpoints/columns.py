from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...models.project import ColumnModel, Project
from ...models.project_user import ProjectUser
from ...schemas.column import ColumnUpdate, ColumnResponse

router = APIRouter()

@router.get("/project/{project_id}")
async def get_columns(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get columns for a project.
    """
    return {"project_id": project_id, "columns": []}


@router.put("/{column_id}", response_model=ColumnResponse)
async def update_column(
    column_id: int,
    column_in: ColumnUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить название колонки"""
    # Получаем колонку
    column = await db.get(ColumnModel, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    # Проверяем, имеет ли пользователь доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == column.project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Обновляем название
    if column_in.column_name:
        column.column_name = column_in.column_name
    
    db.add(column)
    await db.commit()
    await db.refresh(column)
    
    return column

@router.delete("/{column_id}")
async def delete_column(
    column_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить колонку"""
    # Получаем колонку
    column = await db.get(ColumnModel, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    # Проверяем, имеет ли пользователь доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == column.project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Нельзя удалить, если в колонке есть задачи
    from ...models.task import Task
    result = await db.execute(
        select(Task).where(Task.column_id == column_id)
    )
    tasks = result.scalars().all()
    if tasks:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete column with tasks. Move or delete tasks first."
        )
    
    await db.delete(column)
    await db.commit()
    
    return {"message": "Column deleted successfully"}