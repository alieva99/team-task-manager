from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ...core.database import get_db
from ...models.note import Note
from ...models.task import Task
from ...models.project_user import ProjectUser
from ...models.user import User
from ...schemas.note import NoteCreate, NoteUpdate, NoteResponse
from ...core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=NoteResponse)
async def create_note(
    *,
    db: AsyncSession = Depends(get_db),
    note_in: NoteCreate,
    current_user: User = Depends(get_current_user)  # Убедитесь, что используется current_user
):
    """
    Create a new note for a task.
    """
    # Check if task exists
    result = await db.execute(
        select(Task).where(Task.task_id == note_in.task_id)
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
    
    # Создаем заметку с task_user_id
    note = Note(
        task_id=note_in.task_id,
        content=note_in.content,
        task_user_id=current_user.user_id
    )
    
    db.add(note)
    await db.flush()
        
    await db.commit()
    await db.refresh(note)
    
    # Получаем заметку с информацией о пользователе
    result = await db.execute(
        select(Note, User)
        .join(User, Note.task_user_id == User.user_id)
        .where(Note.noted_id == note.noted_id)
    )
    note_with_user = result.first()
    
    if note_with_user:
        note, user = note_with_user
        response = {
            "noted_id": note.noted_id,
            "task_id": note.task_id,
            "content": note.content,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "user": {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "solution_icon": user.solution_icon
            }
        }
        return response
    
    return note

@router.get("/task/{task_id}", response_model=List[NoteResponse])
async def get_notes_by_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all notes for a task with user information.
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
    
    # Получаем заметки с информацией о пользователе
    result = await db.execute(
        select(Note, User)
        .join(User, Note.task_user_id == User.user_id)  # JOIN по task_user_id
        .where(Note.task_id == task_id)
        .order_by(Note.created_at.asc())  # Старые сначала
    )
    rows = result.all()
    
    # Форматируем результат
    notes = []
    for note, user in rows:
        note_dict = {
            "noted_id": note.noted_id,
            "task_id": note.task_id,
            "content": note.content,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "user": {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "solution_icon": user.solution_icon
            }
        }
        notes.append(note_dict)
    
    return notes

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_in: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a note.
    """
    result = await db.execute(
        select(Note).where(Note.noted_id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Проверяем, что пользователь является автором заметки
    if note.task_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own notes")
    
    note.content = note_in.content
    await db.commit()
    await db.refresh(note)
    
    # Получаем заметку с информацией о пользователе
    result = await db.execute(
        select(Note, User)
        .join(User, Note.task_user_id == User.user_id)
        .where(Note.noted_id == note.noted_id)
    )
    note_with_user = result.first()
    
    if note_with_user:
        note, user = note_with_user
        response = {
            "noted_id": note.noted_id,
            "task_id": note.task_id,
            "content": note.content,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
            "user": {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "solution_icon": user.solution_icon
            }
        }
        return response
    
    return note

@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a note.
    """
    result = await db.execute(
        select(Note).where(Note.noted_id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Проверяем, что пользователь является автором заметки
    if note.task_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own notes")
    
    await db.delete(note)
    await db.commit()
    
    return {"message": "Note deleted successfully"}