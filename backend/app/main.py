from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.endpoints import (
    auth_router,
    users_router,
    projects_router,
    tasks_router,
    notes_router,
    columns_router,
    priorities_router, 
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS - исправленная версия
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000",
#         "http://localhost:5173",
#         "https://team-task-manager-api-wk16.onrender.com",
#         "https://team-task-manager-app1.onrender.com",   # ← добавьте эту строку!
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # временно разрешаем все источники
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(tasks_router, prefix=f"{settings.API_V1_STR}/tasks", tags=["tasks"])
app.include_router(notes_router, prefix=f"{settings.API_V1_STR}/notes", tags=["notes"])
app.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(columns_router, prefix=f"{settings.API_V1_STR}/columns", tags=["columns"]) 
app.include_router(priorities_router, prefix=f"{settings.API_V1_STR}/priorities", tags=["priorities"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Team Task Manager API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}