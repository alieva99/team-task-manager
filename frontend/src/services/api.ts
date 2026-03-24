import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Token added to request:', token.substring(0, 20) + '...');
  } else {
    console.log('No token found in localStorage');
  }
  return config;
});

export const authApi = {
  register: (data: { email: string; user_name: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const projectsApi = {
  // Существующие методы
  createProject: (data: { project_name: string; tag_id?: number }) =>
    api.post('/projects/', data),
  
  getProjects: () => api.get('/projects/'),
  
  getProject: (projectId: number) => api.get(`/projects/${projectId}`),
  
  getProjectColumns: (projectId: number) => api.get(`/projects/${projectId}/columns`),
  
  createColumn: (projectId: number, data: { column_name: string }) =>
    api.post(`/projects/${projectId}/columns`, {
      project_id: projectId,
      column_name: data.column_name,
    }),
  
  updateProject: (projectId: number, data: { project_name: string; tag_id?: number }) =>
    api.put(`/projects/${projectId}`, data),
  
  deleteProject: (projectId: number) => api.delete(`/projects/${projectId}`),
  
  // Методы для колонок
  updateColumn: (columnId: number, data: { column_name: string }) =>
    api.put(`/columns/${columnId}`, data),
  
  deleteColumn: (columnId: number) => api.delete(`/columns/${columnId}`),
  
  // Методы для пользователей проекта
  getProjectUsers: (projectId: number) => 
    api.get(`/projects/${projectId}/users`),
  
  // Метод для приглашения пользователя
  inviteUser: (projectId: number, email: string) =>
    api.post(`/projects/${projectId}/invite`, { email }),
};

export const tasksApi = {
  // Получение задач проекта с фильтрацией
  getTasks: (projectId: number, columnId?: number, assigneeId?: number) => {
    let url = `/tasks/project/${projectId}`;
    const params = new URLSearchParams();
    if (columnId) params.append('column_id', columnId.toString());
    if (assigneeId) params.append('assignee_id', assigneeId.toString());
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  
  // Создание задачи
  createTask: (data: any) => api.post('/tasks/', data),
  
  // Обновление задачи
  updateTask: (taskId: number, data: any) => api.put(`/tasks/${taskId}`, data),
  
  // Удаление задачи
  deleteTask: (taskId: number) => api.delete(`/tasks/${taskId}`),
  
  // Перемещение задачи (drag-and-drop)
  moveTask: (taskId: number, targetColumnId: number, newOrder: number) =>
    api.post(`/tasks/${taskId}/move`, { 
      target_column_id: targetColumnId, 
      new_order: newOrder 
    }),
  
  // Получение списка приоритетов
  getPriorities: async () => {
    try {
      // Пробуем получить из API, если эндпоинт существует
      const response = await api.get('/priorities/');
      return response;
    } catch (error) {
      // Если API нет, возвращаем заглушку
      console.log('Using mock priorities data');
      return {
        data: [
          { priority_id: 1, priority_name: 'Высокий', color: '#f44336' },
          { priority_id: 2, priority_name: 'Средний', color: '#ff9800' },
          { priority_id: 3, priority_name: 'Низкий', color: '#4caf50' },
        ]
      };
    }
  },
  getSubtasks: (parentTaskId: number) => 
    api.get(`/tasks/${parentTaskId}/subtasks`),
  
  // Создание подзадачи
  createSubtask: (data: any) => api.post('/tasks/', data), // Используем тот же эндпоинт, но с parent_id
  
  getTaskHistory: (taskId: number) => 
    api.get(`/tasks/${taskId}/history`),
};

export const notesApi = {
  getNotes: (taskId: number) => api.get(`/notes/task/${taskId}`),
  createNote: (data: any) => api.post('/notes/', data),
  updateNote: (noteId: number, data: any) => api.put(`/notes/${noteId}`, data),
  deleteNote: (noteId: number) => api.delete(`/notes/${noteId}`),
};

export const notificationsApi = {
  // Получить уведомления
  getNotifications: (isRead?: boolean) => {
    let url = '/notifications/';
    if (isRead !== undefined) {
      url += `?is_read=${isRead}`;
    }
    return api.get(url);
  },
  
  // Получить количество непрочитанных
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  // Отметить как прочитанное
  markAsRead: (notificationId: number) => 
    api.put(`/notifications/${notificationId}/read`),
  
  // Отметить все как прочитанные
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Удалить уведомление
  deleteNotification: (notificationId: number) => 
    api.delete(`/notifications/${notificationId}`),
  
  // Удалить все прочитанные
  deleteAllRead: () => api.delete('/notifications/'),
};

export default api;