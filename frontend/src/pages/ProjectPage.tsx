import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { projectsApi, tasksApi } from '../services/api';
import SortableTaskCard from '../components/Tasks/SortableTaskCard';
import ColumnHeader from '../components/Tasks/ColumnHeader';
import TaskDetailsPanel from '../components/Tasks/TaskDetailsPanel';
import ProjectHeader from '../components/Project/ProjectHeader';
import ProjectFilters from '../components/Project/ProjectFilters';
import { useUser } from '../context/UserContext';
import InviteUserDialog from '../components/Navigation/InviteUserDialog';
import TasksListView from '../components/Project/TasksListView';
import WeekView from '../components/Project/WeekView';
import MonthView from '../components/Project/MonthView';
import GanttView from '../components/Project/GanttView';
import { useParams, useSearchParams } from 'react-router-dom';

interface Column {
  column_id: number;
  column_name: string;
  order_index_column: number;
}

interface Task {
  task_id: number;
  title: string;
  description?: string;
  column_id: number;
  priority_id?: number;
  is_completed?: boolean;
  deadline?: string;
  focus_time?: number;
  estimated_time?: string;
  order_index_task: number;
  assignee_id?: number;
  parent_id?: number;
  subtasks_count?: number;
}

interface ProjectUser {
  user_id: number;
  user_name: string;
  email: string;
  solution_icon: string;
  project_user_id: number;
}

// Компонент для области сброса в пустую колонку
const DroppableColumnArea: React.FC<{ columnId: number; children: React.ReactNode }> = ({ columnId, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${columnId}`,
    data: {
      type: 'column',
      columnId,
    },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
        borderRadius: 1,
        transition: 'background-color 0.2s',
      }}
    >
      {children}
    </Box>
  );
};

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: userLoading } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskParentId, setNewTaskParentId] = useState<number | undefined>(undefined);
  
  // Состояния для создания колонки
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  // Состояния для фильтров
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Состояние для текущего вида
  const [currentView, setCurrentView] = useState<'overview' | 'board' | 'list' | 'week' | 'month' | 'gantt'>('board');
  
  // Состояния для страницы обзора
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const taskIdFromUrl = searchParams.get('task');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getTasksWithSubtasksCount = (allTasks: Task[]): Task[] => {
    const subtasksCount: { [key: number]: number } = {};
    
    allTasks.forEach(task => {
      if (task.parent_id) {
        subtasksCount[task.parent_id] = (subtasksCount[task.parent_id] || 0) + 1;
      }
    });
    
    return allTasks.map(task => ({
      ...task,
      subtasks_count: subtasksCount[task.task_id] || 0,
    }));
  };

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const projectRes = await projectsApi.getProject(Number(projectId));
      setProjectName(projectRes.data.project_name);

      const columnsRes = await projectsApi.getProjectColumns(Number(projectId));
      setColumns(columnsRes.data);

      const tasksRes = await tasksApi.getTasks(Number(projectId));
      const tasksWithSubtasks = getTasksWithSubtasksCount(tasksRes.data);
      setTasks(tasksWithSubtasks);
      setFilteredTasks(tasksWithSubtasks);
    } catch (err: any) {
      setError('Ошибка при загрузке проекта');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectUsers = async () => {
    try {
      const response = await projectsApi.getProjectUsers(Number(projectId));
      setProjectUsers(response.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Фильтр по дедлайну
    if (deadlineFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(task => {
        if (!task.deadline) return false;
        const deadline = new Date(task.deadline);
        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (deadlineFilter) {
          case '1day':
            return daysLeft === 1;
          case '2days':
            return daysLeft === 2;
          case 'week':
            return daysLeft <= 7 && daysLeft > 0;
          case 'month':
            return daysLeft <= 30 && daysLeft > 0;
          default:
            return true;
        }
      });
    }

    // Фильтр по приоритету
    if (priorityFilter !== 'all') {
      const priorityMap: { [key: string]: number } = {
        'high': 1,
        'medium': 2,
        'low': 3,
      };
      filtered = filtered.filter(task => task.priority_id === priorityMap[priorityFilter]);
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(task => task.is_completed === true);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(task => task.is_completed === false);
      }
    }

    setFilteredTasks(filtered);
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchProjectUsers();
    }
  }, [projectId]);

  useEffect(() => {
    if (tasks.length > 0) {
      applyFilters();
    }
  }, [tasks, deadlineFilter, priorityFilter, statusFilter]);

  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0) {
      const task = tasks.find(t => t.task_id === parseInt(taskIdFromUrl));
      if (task) {
        setSelectedTask(task);
        setTaskDetailsOpen(true);
      }
    }
  }, [taskIdFromUrl, tasks]);

  // Если пользователь еще загружается, показываем загрузку
  if (userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если пользователь не авторизован, показываем предупреждение
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="warning">Необходимо авторизоваться</Alert>
      </Box>
    );
  }

  const handleCreateTask = async () => {
    if (!selectedColumn || !newTaskTitle.trim()) return;

    try {
      const columnTasks = tasks.filter(t => t.column_id === selectedColumn && !t.parent_id);
      const maxOrder = columnTasks.length > 0 
        ? Math.max(...columnTasks.map(t => t.order_index_task || 0)) + 1 
        : 0;

      const response = await tasksApi.createTask({
        project_id: Number(projectId),
        column_id: selectedColumn,
        title: newTaskTitle,
        description: newTaskDescription,
        order_index_task: maxOrder,
        parent_id: newTaskParentId,
      });

      setTasks([...tasks, response.data]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskParentId(undefined);
      setTaskDialogOpen(false);
    } catch (err: any) {
      setError('Ошибка при создании задачи');
    }
  };

  const handleTaskUpdate = (updatedTask: Task | undefined) => {
    if (updatedTask === undefined) {
      fetchProjectData();
    } else {
      setTasks(prevTasks => {
        const existingIndex = prevTasks.findIndex(t => t.task_id === updatedTask.task_id);
        if (existingIndex !== -1) {
          const newTasks = [...prevTasks];
          newTasks[existingIndex] = updatedTask;
          return newTasks;
        } else {
          return [...prevTasks, updatedTask];
        }
      });
      
      setFilteredTasks(prevFiltered => {
        const existingIndex = prevFiltered.findIndex(t => t.task_id === updatedTask.task_id);
        if (existingIndex !== -1) {
          const newFiltered = [...prevFiltered];
          newFiltered[existingIndex] = updatedTask;
          return newFiltered;
        } else {
          return [...prevFiltered, updatedTask];
        }
      });
      
      if (selectedTask?.task_id === updatedTask.task_id) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) {
      setError('Название колонки не может быть пустым');
      return;
    }

    try {
      const response = await projectsApi.createColumn(Number(projectId), {
        column_name: newColumnName,
      });
      
      setColumns([...columns, response.data]);
      setNewColumnName('');
      setColumnDialogOpen(false);
      setError('');
      
    } catch (err: any) {
      console.error('Ошибка при создании колонки:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map((e: any) => e.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Ошибка при создании колонки');
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const handleSubtaskClick = (subtaskId: number) => {
    const subtask = tasks.find(t => t.task_id === subtaskId);
    if (subtask) {
      setSelectedTask(subtask);
      setTaskDetailsOpen(true);
    }
  };

  const handleCreateSubtask = (parentTaskId: number) => {
    const parentTask = tasks.find(t => t.task_id === parentTaskId);
    if (parentTask) {
      setNewTaskParentId(parentTaskId);
      setSelectedColumn(parentTask.column_id);
      setTaskDialogOpen(true);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.task_id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;
    
    const activeTask = tasks.find(t => t.task_id === active.id);
    if (!activeTask) return;
    
    let targetColumnId: number;
    let targetOrder: number;
    
    if (over.data.current?.type === 'column') {
      targetColumnId = over.data.current.columnId;
      const columnTasks = tasks.filter(t => t.column_id === targetColumnId && !t.parent_id);
      targetOrder = columnTasks.length > 0 
        ? Math.max(...columnTasks.map(t => t.order_index_task || 0)) + 1 
        : 0;
    } else {
      const overTask = tasks.find(t => t.task_id === over.id);
      if (!overTask) return;
      
      targetColumnId = overTask.column_id;
      targetOrder = overTask.order_index_task;
    }
    
    try {
      if (activeTask.column_id !== targetColumnId) {
        const oldColumnTasks = tasks
          .filter(t => t.column_id === activeTask.column_id && !t.parent_id)
          .filter(t => t.task_id !== activeTask.task_id)
          .sort((a, b) => (a.order_index_task || 0) - (b.order_index_task || 0));
        
        for (let i = 0; i < oldColumnTasks.length; i++) {
          if (oldColumnTasks[i].order_index_task !== i) {
            await tasksApi.updateTask(oldColumnTasks[i].task_id, {
              order_index_task: i,
            });
          }
        }
        
        const targetColumnTasks = tasks
          .filter(t => t.column_id === targetColumnId && !t.parent_id)
          .filter(t => t.task_id !== activeTask.task_id)
          .sort((a, b) => (a.order_index_task || 0) - (b.order_index_task || 0));
        
        const newTasks = [...targetColumnTasks];
        newTasks.splice(targetOrder, 0, activeTask);
        
        for (let i = 0; i < newTasks.length; i++) {
          await tasksApi.updateTask(newTasks[i].task_id, {
            column_id: targetColumnId,
            order_index_task: i,
          });
        }
        
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            if (task.task_id === activeTask.task_id) {
              return { ...task, column_id: targetColumnId, order_index_task: targetOrder };
            }
            return task;
          });
        });
      } else {
        const columnTasks = tasks
          .filter(t => t.column_id === activeTask.column_id && !t.parent_id)
          .sort((a, b) => (a.order_index_task || 0) - (b.order_index_task || 0));
        
        const oldIndex = columnTasks.findIndex(t => t.task_id === active.id);
        const newIndex = columnTasks.findIndex(t => t.task_id === over.id);
        
        if (oldIndex !== newIndex && newIndex !== -1) {
          const newOrder = arrayMove(columnTasks, oldIndex, newIndex);
          
          for (let i = 0; i < newOrder.length; i++) {
            if (newOrder[i].order_index_task !== i) {
              await tasksApi.updateTask(newOrder[i].task_id, {
                order_index_task: i,
              });
            }
          }
          
          setTasks(prevTasks => {
            const updatedTasks = [...prevTasks];
            newOrder.forEach((task, index) => {
              const taskIndex = updatedTasks.findIndex(t => t.task_id === task.task_id);
              if (taskIndex !== -1) {
                updatedTasks[taskIndex] = { ...task, order_index_task: index };
              }
            });
            return updatedTasks;
          });
        }
      }
    } catch (err) {
      console.error('Ошибка при перемещении задачи:', err);
      setError('Ошибка при перемещении задачи');
      fetchProjectData();
    }
  };

  const handleUpdateProject = async () => {
    if (!projectName.trim()) return;
    
    try {
      await projectsApi.updateProject(Number(projectId), {
        project_name: projectName,
      });
      
      setInviteSuccess('Название проекта обновлено');
      setTimeout(() => setInviteSuccess(''), 3000);
      
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || 'Ошибка при обновлении проекта');
      setTimeout(() => setInviteError(''), 3000);
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Вы уверены, что хотите удалить проект? Это действие нельзя отменить!')) {
      try {
        await projectsApi.deleteProject(Number(projectId));
        window.location.href = '/dashboard';
      } catch (err: any) {
        setInviteError(err.response?.data?.detail || 'Ошибка при удалении проекта');
        setTimeout(() => setInviteError(''), 3000);
      }
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      await projectsApi.inviteUser(Number(projectId), inviteEmail);
      
      setInviteSuccess(`Пользователь с email ${inviteEmail} приглашен в проект`);
      setInviteEmail('');
      await fetchProjectUsers();
      setTimeout(() => setInviteSuccess(''), 3000);
      
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || 'Ошибка при приглашении пользователя');
      setTimeout(() => setInviteError(''), 3000);
    }
  };

  const handleEditProject = () => {
    setCurrentView('overview');
    console.log('Редактирование проекта:', projectId);
  };

  const handleInviteUsers = () => {
    setCurrentView('overview');
    setInviteDialogOpen(true);
  };

  const getTasksByColumn = (columnId: number) => {
    const columnTasks = filteredTasks.filter(task => task.column_id === columnId);
    return columnTasks
      .filter(task => !task.parent_id)
      .sort((a, b) => (a.order_index_task || 0) - (b.order_index_task || 0));
  };

  const getProjectStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.is_completed).length;
    const allCompleted = totalTasks > 0 && completedTasks === totalTasks;
    
    return {
      totalTasks,
      completedTasks,
      allCompleted,
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = getProjectStats();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      p: { xs: 2, sm: 3 }
    }}>
      {/* Верхняя панель с информацией о проекте */}
      <ProjectHeader
        projectName={projectName}
        isCompleted={stats.allCompleted}
        taskCount={stats.totalTasks}
        completedTaskCount={stats.completedTasks}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Контент в зависимости от вида */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', mt: 2 }}>
        {currentView === 'board' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>
            <ProjectFilters
              deadlineFilter={deadlineFilter}
              onDeadlineFilterChange={setDeadlineFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              mt: 2,
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': {
                  background: '#666',
                },
              },
            }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  height: '100%',
                  minHeight: 'min-content',
                }}>
                  {columns.map((column) => {
                    const columnTasks = getTasksByColumn(column.column_id);
                    
                    return (
                      <Paper
                        key={column.column_id}
                        sx={{
                          p: 2,
                          minWidth: { xs: 280, sm: 300, md: 320 },
                          maxWidth: { xs: 280, sm: 300, md: 320 },
                          height: 'auto',
                          minHeight: 200,
                          backgroundColor: '#f5f5f5',
                          display: 'flex',
                          flexDirection: 'column',
                          flexShrink: 0,
                        }}
                      >
                        <ColumnHeader
                          column={column}
                          taskCount={columnTasks.length}
                          onAddTask={() => {
                            setSelectedColumn(column.column_id);
                            setNewTaskParentId(undefined);
                            setTaskDialogOpen(true);
                          }}
                          onColumnUpdated={fetchProjectData}
                          onColumnDeleted={fetchProjectData}
                        />

                        <DroppableColumnArea columnId={column.column_id}>
                          {columnTasks.length > 0 ? (
                            <SortableContext
                              items={columnTasks.map(t => t.task_id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <Box sx={{ 
                                flex: 1, 
                                overflowY: 'auto',
                                maxHeight: 'calc(100vh - 280px)',
                                minHeight: 100,
                                '&::-webkit-scrollbar': {
                                  width: '6px',
                                },
                                '&::-webkit-scrollbar-track': {
                                  background: '#f1f1f1',
                                  borderRadius: '3px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  background: '#888',
                                  borderRadius: '3px',
                                },
                              }}>
                                {columnTasks.map((task) => (
                                  <SortableTaskCard 
                                    key={task.task_id} 
                                    task={task} 
                                    onClick={() => handleTaskClick(task)}
                                    level={0}
                                  />
                                ))}
                              </Box>
                            </SortableContext>
                          ) : (
                            <Box
                              sx={{
                                flex: 1,
                                minHeight: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px dashed #ccc',
                                borderRadius: 1,
                                color: '#999',
                                fontSize: '0.9rem',
                              }}
                            >
                              Тут пока пусто
                            </Box>
                          )}
                        </DroppableColumnArea>
                      </Paper>
                    );
                  })}
                  
                  {/* Кнопка для добавления новой колонки */}
                  <Paper
                    onClick={() => setColumnDialogOpen(true)}
                    sx={{
                      minWidth: { xs: 280, sm: 300, md: 300 },
                      maxWidth: { xs: 280, sm: 300, md: 300 },
                      height: 'auto',
                      minHeight: 200,
                      backgroundColor: 'transparent',
                      border: '2px dashed #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderColor: '#1976d2',
                        '& .MuiTypography-root': {
                          color: '#1976d2',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddIcon sx={{ color: '#666' }} />
                      <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>
                        Добавить колонку
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
                
                <DragOverlay>
                  {activeTask ? (
                    <Paper sx={{ p: 2, opacity: 0.8, boxShadow: 3, width: 280 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {activeTask.title}
                      </Typography>
                    </Paper>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </Box>
          </Box>
        )}

        {/* Страница обзора проекта */}
        {currentView === 'overview' && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {/* Левая колонка - редактирование проекта */}
              <Paper sx={{ p: 3, flex: 1, minWidth: 280 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Редактирование проекта
                </Typography>
                
                <Box component="form" sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Название проекта"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleUpdateProject}
                      disabled={!projectName.trim()}
                    >
                      Сохранить изменения
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteProject}
                    >
                      Удалить проект
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Правая колонка - приглашение пользователей */}
              <Paper sx={{ p: 3, flex: 1, minWidth: 280 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Пригласить в проект
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Email пользователя"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    placeholder="user@example.com"
                    helperText="Пользователь должен быть зарегистрирован в системе"
                  />
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleInviteUser}
                    disabled={!inviteEmail.trim()}
                    startIcon={<PersonAddIcon />}
                    sx={{ mt: 2 }}
                  >
                    Отправить приглашение
                  </Button>

                  {inviteSuccess && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      {inviteSuccess}
                    </Alert>
                  )}
                  
                  {inviteError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {inviteError}
                    </Alert>
                  )}
                </Box>

                {/* Список участников проекта */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Участники проекта
                  </Typography>
                  
                  {projectUsers.length > 0 ? (
                    <List>
                      {projectUsers.map((userItem) => (
                        <ListItem key={userItem.user_id} disablePadding>
                          <ListItemAvatar>
                            <Avatar>
                              {userItem.user_name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={userItem.user_name}
                            secondary={userItem.email}
                          />
                          {userItem.user_id === user?.user_id && (
                            <Chip label="Это вы" size="small" color="primary" />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      В проекте пока нет участников
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        {/* Список задач */}
        {currentView === 'list' && (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <ProjectFilters
              deadlineFilter={deadlineFilter}
              onDeadlineFilterChange={setDeadlineFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            <TasksListView
              tasks={filteredTasks} 
              columns={columns}
              projectUsers={projectUsers}
              onTaskClick={handleTaskClick}
            />
          </Box>
        )}

        {/* Недельное представление */}
        {currentView === 'week' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>
            <ProjectFilters
              deadlineFilter={deadlineFilter}
              onDeadlineFilterChange={setDeadlineFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              mt: 2,
              minHeight: 0,
            }}>
              <WeekView
                tasks={filteredTasks}
                columns={columns}
                projectUsers={projectUsers}
                onTaskClick={handleTaskClick}
              />
            </Box>
          </Box>
        )}

        {/* Месячное представление */}
        {currentView === 'month' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>
            <ProjectFilters
              deadlineFilter={deadlineFilter}
              onDeadlineFilterChange={setDeadlineFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              mt: 2,
              minHeight: 0,
            }}>
              <MonthView
                tasks={filteredTasks}
                columns={columns}
                projectUsers={projectUsers}
                onTaskClick={handleTaskClick}
              />
            </Box>
          </Box>
        )}

        {/* Диаграмма Ганта */}
        {currentView === 'gantt' && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>
            <ProjectFilters
              deadlineFilter={deadlineFilter}
              onDeadlineFilterChange={setDeadlineFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            <Box sx={{ 
              flex: 1,
              overflow: 'auto',
              mt: 2,
              minHeight: 0,
            }}>
              <GanttView
                tasks={filteredTasks}
                columns={columns}
                projectUsers={projectUsers}
                onTaskClick={handleTaskClick}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Диалоги */}
      <Dialog open={taskDialogOpen} onClose={() => {
        setTaskDialogOpen(false);
        setNewTaskParentId(undefined);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {newTaskParentId ? 'Создать подзадачу' : 'Создать задачу'}
        </DialogTitle>
        <DialogContent>
          {newTaskParentId && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Создание подзадачи для: {tasks.find(t => t.task_id === newTaskParentId)?.title}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            variant="outlined"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTaskDialogOpen(false);
            setNewTaskParentId(undefined);
          }}>
            Отмена
          </Button>
          <Button onClick={handleCreateTask} variant="contained">
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={columnDialogOpen} onClose={() => setColumnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новую колонку</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название колонки"
            fullWidth
            variant="outlined"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="Например: В ожидании"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColumnDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateColumn} variant="contained">
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Панель с деталями задачи */}
      <TaskDetailsPanel
        task={selectedTask}
        open={taskDetailsOpen}
        onClose={() => setTaskDetailsOpen(false)}
        onTaskUpdate={handleTaskUpdate}
        projectId={Number(projectId)}
        onOpenSubtask={(subtaskId) => {
          const subtask = tasks.find(t => t.task_id === subtaskId);
          if (subtask) {
            setSelectedTask(subtask);
          }
        }}
      />

      {/* Диалог приглашения пользователей */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        projects={[{ project_id: Number(projectId), project_name: projectName }]}
        onSuccess={(message) => {
          console.log(message);
        }}
      />
    </Box>
  );
};

export default ProjectPage;