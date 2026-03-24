from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...models.task import Task
from ...models.history import History, Action
from ...models.project_user import ProjectUser
from ...models.user import User  # ДОБАВЬТЕ ЭТУ СТРОКУ
from ...schemas.task import TaskCreate, TaskUpdate, TaskResponse
from ..endpoints.auth import oauth2_scheme
from ...core.security import get_current_user

router = APIRouter()

async def create_history_entry(
    db: AsyncSession,
    task_id: int,
    user_id: int,
    action_name: str,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None
):
    """Create a history entry for task changes"""
    
    # Создаем JSONB content с информацией об изменении
    content = {
        "task_id": task_id,
        "field": action_name.replace("UPDATE_", "").lower() if "UPDATE" in action_name else None,
        "old_value": old_value,
        "new_value": new_value
    }
    
    # Создаем запись истории напрямую, без обращения к таблице actions
    history = History(
        action_name=action_name,  # ← Используем action_name напрямую
        task_user_id=user_id,
        content=content
    )
    db.add(history)

@router.post("/", response_model=TaskResponse)
async def create_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_in: TaskCreate,
    token: str = Depends(oauth2_scheme)
):
    """
    Create new task.
    """
    user = await get_current_user(db, token)
    
    # Get max order index for the column
    result = await db.execute(
        select(Task)
        .where(Task.column_id == task_in.column_id)
        .order_by(Task.order_index_task.desc())
        .limit(1)
    )
    last_task = result.scalar_one_or_none()
    order_index = (last_task.order_index_task + 1) if last_task else 0
    
    # Create task
    task_data = task_in.dict(exclude_unset=True)
    task = Task(
        **task_data,
        order_index_task=order_index
    )
    db.add(task)
    await db.flush()
    
    # Create history entry
    await create_history_entry(
        db, 
        task.task_id, 
        user.user_id, 
        "CREATE_TASK",
        None, 
        task.title
    )
    
    await db.commit()
    await db.refresh(task)
    
    return task

@router.get("/project/{project_id}", response_model=List[TaskResponse])
async def get_tasks_by_project(
    project_id: int,
    column_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all tasks for a project with optional filters.
    """
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
    
    query = select(Task).where(Task.project_id == project_id)
    
    if column_id:
        query = query.where(Task.column_id == column_id)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
        
    query = query.order_by(Task.column_id, Task.order_index_task)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    # Используем метод to_dict() для сериализации
    return [task.to_dict() for task in tasks]

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Update a task.
    """
    user = await get_current_user(db, token)
    
    # Get existing task
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
  
    # Track changes for history
    update_data = task_in.dict(exclude_unset=True)
    
    for field, new_value in update_data.items():
        old_value = getattr(task, field)
        if old_value != new_value:
            action_name = f"UPDATE_{field.upper()}"
            
            await create_history_entry(
                db,
                task_id,
                user.user_id,
                action_name,
                str(old_value) if old_value else None,
                str(new_value) if new_value else None
            )
                   
        setattr(task, field, new_value)
    
    task.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(task)
    
    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Delete a task.
    """
    user = await get_current_user(db, token)
    
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Create history entry for deletion
    await create_history_entry(
        db,
        task_id,
        user.user_id,
        "DELETE_TASK",
        task.title,
        None
    )
    
    await db.delete(task)
    await db.commit()
    
    return {"message": "Task deleted successfully"}

@router.post("/{task_id}/move")
async def move_task(
    task_id: int,
    target_column_id: int,
    new_order: int,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """
    Move task to another column (for drag-and-drop).
    """
    user = await get_current_user(db, token)
    
    # Get task
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_column_id = task.column_id
    
    if old_column_id != target_column_id:
        # Update order indices in old column
        await db.execute(
            update(Task)
            .where(Task.column_id == old_column_id)
            .where(Task.order_index_task > task.order_index_task)
            .values(order_index_task=Task.order_index_task - 1)
        )
        
        # Update order indices in new column
        await db.execute(
            update(Task)
            .where(Task.column_id == target_column_id)
            .where(Task.order_index_task >= new_order)
            .values(order_index_task=Task.order_index_task + 1)
        )
        
        # Move task
        task.column_id = target_column_id
        task.order_index_task = new_order
        
        # Create history entry
        await create_history_entry(
            db,
            task_id,
            user.user_id,
            "MOVE_TASK",
            f"Column: {old_column_id}",
            f"Column: {target_column_id}"
        )
        
        await db.commit()
    
    return {"message": "Task moved successfully"}

@router.get("/{task_id}/subtasks", response_model=List[TaskResponse])
async def get_subtasks(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all subtasks for a specific task.
    """
    # Проверяем, существует ли задача
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == task.project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Получаем подзадачи
    result = await db.execute(
        select(Task)
        .where(Task.parent_id == task_id)
        .order_by(Task.created_at)
    )
    subtasks = result.scalars().all()
    
    return [subtask.to_dict() for subtask in subtasks]

@router.get("/{task_id}/history")
async def get_task_history(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get history for a specific task with user details.
    """
    # Проверяем, существует ли задача
    result = await db.execute(
        select(Task).where(Task.task_id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Проверяем доступ к проекту
    result = await db.execute(
        select(ProjectUser)
        .where(
            ProjectUser.project_id == task.project_id,
            ProjectUser.user_id == current_user.user_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Получаем историю задачи с информацией о пользователе и действии
# Предполагаем, что в таблице histories теперь есть колонка action_name (VARCHAR)
    result = await db.execute(
    select(History, User)
    .join(User, History.task_user_id == User.user_id)
    .where(History.content['task_id'].astext == str(task_id))
    .order_by(History.history_updated_at.desc())
    )
    rows = result.all()

    history_items = []
    for history, user in rows:
    # action_name теперь берем напрямую из history
        history_items.append({
        "history_id": history.history_id,
        "task_user_id": history.task_user_id,
        "content": history.content,
        "history_updated_at": history.history_updated_at,
        "action_name": history.action_name,  # ← новое поле
        "user": {
            "user_id": user.user_id,
            "user_name": user.user_name,
            "solution_icon": user.solution_icon
        }
    })
    return history_items