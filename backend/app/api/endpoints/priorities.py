from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from ...core.database import get_db
from ...models.task import Priority
from ...schemas.priority import PriorityResponse

router = APIRouter()

@router.get("/", response_model=List[PriorityResponse])
async def get_priorities(
    db: AsyncSession = Depends(get_db)
):
    """
    Get all priorities.
    """
    result = await db.execute(
        select(Priority).order_by(Priority.priority_id)
    )
    priorities = result.scalars().all()
    return priorities