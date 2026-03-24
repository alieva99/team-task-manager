from .auth import router as auth_router
from .users import router as users_router
from .projects import router as projects_router
from .tasks import router as tasks_router
from .notes import router as notes_router
from .columns import router as columns_router
from .priorities import router as priorities_router

__all__ = [
    'auth_router',
    'users_router',
    'projects_router',
    'tasks_router',
    'notes_router',
    'columns_router',
    'priorities_router',
]