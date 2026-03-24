from fastapi import APIRouter, Depends, HTTPException, status, Body  
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...models.project import Project
from ...models.project_user import ProjectUser
from ...models.project import ColumnModel  # Добавьте этот импорт
from ...schemas.project import ProjectCreate, ProjectResponse, ProjectWithColumnsResponse, ProjectUpdate
from ...schemas.column import ColumnCreate, ColumnResponse
from ...schemas.user import UserResponse  # Добавьте эту строку в начало файла

router = APIRouter()

@router.post("/", response_model=ProjectResponse)
async def create_project(
    *,
    db: AsyncSession = Depends(get_db),
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать новый проект с тремя стандартными колонками"""
    
    # Создаем проект - убрали tag_id
    project = Project(
        project_name=project_in.project_name,
        created_by=current_user.user_id
        # tag_id убран
    )
    db.add(project)
    await db.flush()
    
    # Создаем три стандартные колонки
    columns = [
        {"name": "К работе", "order": 0},
        {"name": "В работе", "order": 1},
        {"name": "Готово", "order": 2}
    ]
    
    from ...models.project import ColumnModel
    for col_data in columns:
        column = ColumnModel(
            project_id=project.project_id,
            column_name=col_data["name"],
            order_index_column=col_data["order"]
        )
        db.add(column)
    
    # Добавляем создателя как администратора проекта
    project_user = ProjectUser(
        project_id=project.project_id,
        user_id=current_user.user_id,
        is_admin=True  # вместо role_id=1
    )
    db.add(project_user)
    
    await db.commit()
    await db.refresh(project)
    
    return project

@router.get("/", response_model=List[ProjectResponse])
async def get_my_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все проекты текущего пользователя"""
    result = await db.execute(
        select(Project)
        .join(ProjectUser)
        .where(ProjectUser.user_id == current_user.user_id)
    )
    projects = result.scalars().all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить проект по ID"""
    # Проверяем, имеет ли пользователь доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = await db.execute(
        select(Project).where(Project.project_id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project

@router.get("/{project_id}/columns", response_model=List[ColumnResponse])
async def get_project_columns(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить колонки проекта"""
    
    # Проверяем доступ
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    result = await db.execute(
        select(ColumnModel)
        .where(ColumnModel.project_id == project_id)
        .order_by(ColumnModel.order_index_column)
    )
    columns = result.scalars().all()
    return columns

@router.post("/{project_id}/columns", response_model=ColumnResponse)
async def create_column(
    project_id: int,
    column_in: ColumnCreate,  # FastAPI автоматически возьмет данные из тела запроса
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую колонку в проекте"""
    # Проверяем, имеет ли пользователь доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Проверяем, существует ли проект
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Получаем максимальный порядковый номер для новой колонки
    # ИСПРАВЛЕНИЕ: добавляем .limit(1) чтобы получить только одну строку
    result = await db.execute(
        select(ColumnModel)
        .where(ColumnModel.project_id == project_id)
        .order_by(ColumnModel.order_index_column.desc())
        .limit(1)  # <-- добавляем limit(1)
    )
    last_column = result.scalar_one_or_none()
    next_order = (last_column.order_index_column + 1) if last_column else 0
    
    # Создаем новую колонку
    column = ColumnModel(
        project_id=project_id,
        column_name=column_in.column_name,
        order_index_column=next_order
    )
    db.add(column)
    await db.commit()
    await db.refresh(column)
    
    return column

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить проект"""
    # Проверяем, имеет ли пользователь доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Получаем проект
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Обновляем поля
    update_data = project_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить проект"""
    # Проверяем, является ли пользователь создателем проекта
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.created_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only project creator can delete the project")
    
    await db.delete(project)
    await db.commit()
    
    return {"message": "Project deleted successfully"}

@router.get("/{project_id}/users", response_model=List[UserResponse])
async def get_project_users(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить всех пользователей проекта"""
    # Проверяем, имеет ли пользователь доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Получаем всех пользователей проекта
    result = await db.execute(
        select(User)
        .join(ProjectUser)
        .where(ProjectUser.project_id == project_id)
    )
    users = result.scalars().all()
    
    return users

@router.post("/{project_id}/invite")
async def invite_user(
    project_id: int,
    email: str = Body(..., embed=True),  # email в теле запроса
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Пригласить пользователя в проект по email"""
    
    # Проверяем, является ли текущий пользователь администратором проекта
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    project_user = result.scalar_one_or_none()
    
    if not project_user or not project_user.is_admin:
        raise HTTPException(status_code=403, detail="Только администратор может приглашать пользователей")
    
    # Ищем пользователя по email
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user_to_invite = result.scalar_one_or_none()
    
    if not user_to_invite:
        raise HTTPException(status_code=404, detail="Пользователь с таким email не найден")
    
    # Проверяем, не состоит ли уже пользователь в проекте
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == project_id,
            ProjectUser.user_id == user_to_invite.user_id
        )
    )
    existing_membership = result.scalar_one_or_none()
    
    if existing_membership:
        raise HTTPException(status_code=400, detail="Пользователь уже состоит в проекте")
    
    # Добавляем пользователя в проект (is_admin=False - обычный пользователь)
    new_member = ProjectUser(
        project_id=project_id,
        user_id=user_to_invite.user_id,
        is_admin=False  # Важно: не администратор!
    )
    
    db.add(new_member)
    await db.commit()
    
    return {"message": f"Пользователь {user_to_invite.user_name} добавлен в проект"}