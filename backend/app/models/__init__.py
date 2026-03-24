from .user import User, Role
from .project import Project, ColumnModel
from .project_user import ProjectUser
from .task import Task, Priority
from .note import Note
from .history import History
from .notification import Notification  # Добавьте эту строку

__all__ = [
    'User', 'Role',
    'Project', 'ColumnModel',
    'ProjectUser',
    'Task', 'Priority',
    'Note',
    'History', 'Action',
    'Notification',  # Добавьте эту строку
]