import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from ..core.database import AsyncSessionLocal
from ..models.task import Task
from ..models.project_user import ProjectUser
from .notification_service import NotificationService

async def check_deadlines():
    """Проверка дедлайнов и создание уведомлений"""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # Проверяем задачи с дедлайном
                now = datetime.utcnow()
                
                # Задачи, дедлайн которых приближается (через 1 день, 3 дня)
                upcoming_deadlines = await db.execute(
                    select(Task).where(
                        and_(
                            Task.deadline.isnot(None),
                            Task.is_completed == False,
                            Task.deadline > now,
                            Task.deadline <= now + timedelta(days=3)
                        )
                    )
                )
                tasks_upcoming = upcoming_deadlines.scalars().all()
                
                notification_service = NotificationService(db)
                
                for task in tasks_upcoming:
                    days_left = (task.deadline - now).days
                    if days_left in [1, 3]:  # Уведомляем за 1 и 3 дня
                        await notification_service.notify_deadline_approaching(task, days_left)
                
                # Просроченные задачи
                overdue_tasks = await db.execute(
                    select(Task).where(
                        and_(
                            Task.deadline.isnot(None),
                            Task.is_completed == False,
                            Task.deadline < now
                        )
                    )
                )
                tasks_overdue = overdue_tasks.scalars().all()
                
                for task in tasks_overdue:
                    days_overdue = (now - task.deadline).days
                    if days_overdue in [1, 3, 7]:  # Уведомляем на 1, 3, 7 день просрочки
                        await notification_service.notify_deadline_overdue(task, days_overdue)
                
                await db.commit()
                
        except Exception as e:
            print(f"Error in deadline checker: {e}")
        
        # Проверяем каждый час
        await asyncio.sleep(3600)

# Функция для запуска в отдельном процессе
def start_deadline_checker():
    asyncio.create_task(check_deadlines())