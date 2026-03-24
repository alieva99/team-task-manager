import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Popover,
  DialogContent,
  Dialog,
  DialogActions,
  DialogTitle,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  HourglassEmpty as HourglassIcon,
  Flag as FlagIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { tasksApi, projectsApi } from '../../services/api';
import SubtaskList from './SubtaskList';
import HistoryList from './HistoryList';
import CommentsSection from './CommentsSection';
import { useUser } from '../../context/UserContext';

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
}

interface ProjectUser {
  project_user_id: number;
  user_id: number;
  user_name: string;
  email: string;
  solution_icon?: string;
}

interface Priority {
  priority_id: number;
  priority_name: string;
  color: string;
}

interface Subtask {
  task_id: number;
  title: string;
  is_completed: boolean;
}

interface TaskDetailsPanelProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onTaskUpdate: (updatedTask?: Task | undefined) => void;
  projectId: number;
  onOpenSubtask?: (subtaskId: number) => void;
}

const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({
  task,
  open,
  onClose,
  onTaskUpdate,
  projectId,
  onOpenSubtask,
}) => {
  const { user } = useUser();
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  
  // Состояния для приоритета
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [priorityId, setPriorityId] = useState<number | undefined>(undefined);
  
  // Состояния для дедлайна
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [deadlineTime, setDeadlineTime] = useState<Date | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Состояния для оценки времени
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0);
  const [estimatedAnchorEl, setEstimatedAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Состояния для подзадач
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('');
const [newSubtaskParentId, setNewSubtaskParentId] = useState<number | undefined>(undefined);
  // Состояния для истории
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Для накопления изменений
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Функция для сохранения всех накопленных изменений
  const saveChanges = async () => {
    if (!task || Object.keys(pendingChanges).length === 0 || isSaving) return;

    setIsSaving(true);
    
    try {
      await tasksApi.updateTask(task.task_id, pendingChanges);
      
      // Обновляем локальную задачу
      const updatedTask = { ...task, ...pendingChanges };
      onTaskUpdate(updatedTask);
      
      // Очищаем накопленные изменения
      setPendingChanges({});
      
      // Обновляем историю
      fetchHistory();
      
    } catch (err: any) {
      console.error('Ошибка при сохранении:', err);
      setError(err.response?.data?.detail || 'Ошибка при сохранении изменений');
    } finally {
      setIsSaving(false);
    }
  };

  // Функция для добавления изменения в очередь
  const queueChange = (field: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Автосохранение через 1 секунду после последнего изменения
  useEffect(() => {
    if (Object.keys(pendingChanges).length === 0) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [pendingChanges]);

  // Закрытие панели - сохраняем все изменения
  const handleClose = () => {
    if (Object.keys(pendingChanges).length > 0 && !isSaving) {
      saveChanges().finally(() => {
        onClose();
      });
    } else {
      onClose();
    }
  };

  // Загрузка пользователей проекта и приоритетов
  useEffect(() => {
    if (open && projectId) {
      fetchPriorities();
    }
  }, [open, projectId]);

  // Загрузка подзадач при открытии задачи
  useEffect(() => {
    if (task && open) {
      fetchSubtasks();
      fetchHistory();
    }
  }, [task, open]);

  // Сброс состояния при открытии новой задачи
  useEffect(() => {
    if (task && open) {
      // Сбрасываем накопленные изменения
      setPendingChanges({});
      
      setIsCompleted(task.is_completed === true);
      setDescription(task.description || '');
      setTotalSeconds(task.focus_time || 0);
      setTimerSeconds(0);
      setIsTimerActive(false);
      setStartTime(null);
      setError('');
      setAssigneeId(task.assignee_id);
      setPriorityId(task.priority_id);
      
      if (task.deadline) {
        const deadline = parseISO(task.deadline);
        setDeadlineDate(deadline);
        setDeadlineTime(deadline);
      } else {
        setDeadlineDate(null);
        setDeadlineTime(null);
      }

      if (task.estimated_time) {
        const estimated = parseISO(task.estimated_time);
        setEstimatedHours(estimated.getHours());
        setEstimatedMinutes(estimated.getMinutes());
      } else {
        setEstimatedHours(0);
        setEstimatedMinutes(0);
      }
      if (task.assignee_id) {
      const projectUser = projectUsers.find(u => u.user_id === task.assignee_id);
      setAssigneeId(projectUser?.project_user_id);
      } else {
      setAssigneeId(undefined);
      }
    }
  }, [task, open, projectUsers]);

  const fetchProjectUsers = async () => {
    try {
      const response = await projectsApi.getProjectUsers(projectId);
      setProjectUsers(response.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    }
  };

  const fetchPriorities = async () => {
    try {
      const response = await tasksApi.getPriorities();
      setPriorities(response.data);
    } catch (err) {
      console.error('Ошибка загрузки приоритетов:', err);
    }
  };

  const fetchSubtasks = async () => {
    if (!task) return;
    
    setSubtasksLoading(true);
    try {
      const response = await tasksApi.getSubtasks(task.task_id);
      setSubtasks(response.data);
    } catch (err) {
      console.error('Ошибка загрузки подзадач:', err);
    } finally {
      setSubtasksLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!task) return;
    
    setHistoryLoading(true);
    try {
      const response = await tasksApi.getTaskHistory(task.task_id);
      setHistory(response.data);
    } catch (err) {
      console.error('Ошибка загрузки истории:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Таймер для текущей сессии
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    
    if (isTimerActive && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTimerSeconds(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive, startTime]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatDeadline = (date: Date | null): string => {
    if (!date) return 'Не установлен';
    return format(date, 'dd.MM.yyyy HH:mm');
  };

  const formatEstimatedTime = (hours: number, minutes: number): string => {
    if (hours === 0 && minutes === 0) return 'Не оценено';
    const parts = [];
    if (hours > 0) parts.push(`${hours} ч`);
    if (minutes > 0) parts.push(`${minutes} мин`);
    return parts.join(' ');
  };

  const getPriorityName = (id: number | undefined): string => {
    if (!id) return 'Не установлен';
    const priority = priorities.find(p => p.priority_id === id);
    return priority ? priority.priority_name : 'Не установлен';
  };

  const getPriorityColor = (id: number | undefined): string => {
    if (!id) return '#9e9e9e';
    const priority = priorities.find(p => p.priority_id === id);
    return priority ? priority.color : '#9e9e9e';
  };

const handleToggleComplete = async () => {
  const newCompletedState = !isCompleted;
  setIsCompleted(newCompletedState);
  await updateTaskAndParent({ is_completed: newCompletedState });
};

const handleToggleTimer = async () => {
  if (isTimerActive) {
    const newTotalSeconds = totalSeconds + timerSeconds;
    setTotalSeconds(newTotalSeconds);
    setTimerSeconds(0);
    setIsTimerActive(false);
    setStartTime(null);
    await updateTaskAndParent({ focus_time: newTotalSeconds });
  } else {
    setStartTime(new Date());
    setTimerSeconds(0);
    setIsTimerActive(true);
  }
};

const handleDescriptionChange = async () => {
  await updateTaskAndParent({ description });
};


// const handleAssigneeChange = async (newAssigneeId: number | undefined) => {
//   setAssigneeId(newAssigneeId);
//   await updateTaskAndParent({ assignee_id: newAssigneeId });
// };
const handleAssigneeChange = async (newProjectUserId: number | undefined) => {
  console.log('=== handleAssigneeChange ===');
  console.log('1. Выбранный project_user_id:', newProjectUserId);
  console.log('2. Все projectUsers:', projectUsers);
  
  const selectedProjectUser = projectUsers.find(u => u.project_user_id === newProjectUserId);
  console.log('3. Найденный пользователь по project_user_id:', selectedProjectUser);
  
  const newUserId = selectedProjectUser?.user_id;
  console.log('4. Найденный user_id:', newUserId);
  console.log('5. Мой user_id:', user?.user_id);
  
  if (newUserId === user?.user_id) {
    console.log('⚠️ ВНИМАНИЕ: Выбранный пользователь - это Я!');
  } else if (newUserId) {
    console.log('✅ Выбран другой пользователь:', selectedProjectUser?.user_name);
  } else {
    console.log('❌ Пользователь не найден');
  }
  
  setAssigneeId(newProjectUserId);
  
  if (newUserId !== undefined) {
    console.log('📤 Отправляем запрос на обновление assignee_id:', newUserId);
    await updateTaskAndParent({ assignee_id: newUserId });
  } else {
    console.log('❌ newUserId undefined, запрос не отправлен');
  }
};

const handlePriorityChange = async (newPriorityId: number | undefined) => {
  setPriorityId(newPriorityId);
  await updateTaskAndParent({ priority_id: newPriorityId });
};


  const updateTaskAndParent = async (updates: Partial<Task>) => {
  if (!task) return;
  
  try {
    // Сохраняем в БД
    await tasksApi.updateTask(task.task_id, updates);
    
    // Обновляем локальное состояние задачи в родителе через колбэк
    const updatedTask = { ...task, ...updates };
    onTaskUpdate(updatedTask);
    
    // Обновляем историю
    fetchHistory();
    
    return true;
  } catch (err: any) {
    console.error('Ошибка при сохранении:', err);
    setError(err.response?.data?.detail || 'Ошибка при сохранении изменений');
    return false;
  }
};

  const handleDeadlineSave = async () => {
  if (!deadlineDate) {
    setDeadlineDate(null);
    setDeadlineTime(null);
    await updateTaskAndParent({ deadline: undefined });  // ← null → undefined
    setAnchorEl(null);
    return;
  }

  let deadline = new Date(deadlineDate);
  
  if (deadlineTime) {
    deadline.setHours(deadlineTime.getHours());
    deadline.setMinutes(deadlineTime.getMinutes());
  } else {
    deadline.setHours(23, 59, 59);
  }

  setDeadlineDate(deadline);
  await updateTaskAndParent({ deadline: deadline.toISOString() });
  setAnchorEl(null);
};

const handleClearDeadline = async () => {
  setDeadlineDate(null);
  setDeadlineTime(null);
  await updateTaskAndParent({ deadline: undefined });  // ← null → undefined
  setAnchorEl(null);
};

const handleEstimatedSave = async () => {
  if (estimatedHours === 0 && estimatedMinutes === 0) {
    await updateTaskAndParent({ estimated_time: undefined });  // ← null → undefined
    setEstimatedAnchorEl(null);
    return;
  }

  const estimated = new Date();
  estimated.setHours(estimatedHours, estimatedMinutes, 0, 0);
  await updateTaskAndParent({ estimated_time: estimated.toISOString() });
  setEstimatedAnchorEl(null);
};

const handleClearEstimated = async () => {
  setEstimatedHours(0);
  setEstimatedMinutes(0);
  await updateTaskAndParent({ estimated_time: undefined });  // ← null → undefined
  setEstimatedAnchorEl(null);
};

  // const handleCreateSubtask = async () => {
  //   if (!task || !newSubtaskTitle.trim()) return;

  //   setLoading(true);
  //   setError('');

  //   try {
  //     const response = await tasksApi.createSubtask({
  //       project_id: projectId,
  //       column_id: task.column_id,
  //       title: newSubtaskTitle,
  //       description: newSubtaskDescription,
  //       parent_id: task.task_id,
  //     });

  //     setNewSubtaskTitle('');
  //     setNewSubtaskDescription('');
  //     setCreateSubtaskOpen(false);
  //     await fetchSubtasks();
  //     fetchHistory();
      
  //     // Обновляем родительскую задачу, чтобы подзадача появилась в доске
  //     onTaskUpdate({ ...task });
      
  //   } catch (err: any) {
  //     console.error('Ошибка при создании подзадачи:', err);
  //     setError(err.response?.data?.detail || 'Ошибка при создании подзадачи');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleCreateSubtask = async () => {
  if (!task || !newSubtaskTitle.trim()) return;

  setLoading(true);
  setError('');

  try {
    const response = await tasksApi.createSubtask({
      project_id: projectId,
      column_id: task.column_id,
      title: newSubtaskTitle,
      description: newSubtaskDescription,
      parent_id: task.task_id,
    });

    setNewSubtaskTitle('');
    setNewSubtaskDescription('');
    setCreateSubtaskOpen(false);
    
    // Обновляем список подзадач
    await fetchSubtasks();
    
    // Обновляем родительский компонент - добавляем новую подзадачу в общий список задач
    // Это ключевое изменение!
    onTaskUpdate(response.data);  // ← добавляем новую подзадачу в общий список
    fetchHistory();
    
  } catch (err: any) {
    console.error('Ошибка при создании подзадачи:', err);
    setError(err.response?.data?.detail || 'Ошибка при создании подзадачи');
  } finally {
    setLoading(false);
  }
};

const handleDeleteTask = async () => {
  if (!task) return;
  
  // Подтверждение удаления
  const confirmDelete = window.confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?\nЭто действие нельзя отменить!`);
  
  if (!confirmDelete) return;
  
  setLoading(true);
  setError('');
  
  try {
    await tasksApi.deleteTask(task.task_id);
    
    // Уведомляем родительский компонент об удалении
    onTaskUpdate(undefined);  // undefined означает, что задача удалена
    
    // Закрываем панель
    onClose();
    
  } catch (err: any) {
    console.error('Ошибка при удалении задачи:', err);
    setError(err.response?.data?.detail || 'Ошибка при удалении задачи');
  } finally {
    setLoading(false);
  }
};

  const handleSubtaskToggleComplete = async (subtaskId: number, completed: boolean) => {
    try {
      await tasksApi.updateTask(subtaskId, {
        is_completed: completed,
      });
      await fetchSubtasks();
      fetchHistory();
    } catch (err) {
      console.error('Ошибка при обновлении подзадачи:', err);
    }
  };

  if (!task) return null;

  const displayTotalSeconds = totalSeconds + (isTimerActive ? timerSeconds : 0);
  const selectedUserData = projectUsers.find(u => u.project_user_id === assigneeId);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            boxSizing: 'border-box',
            p: 2.5,
          },
        }}
      >
{/* Заголовок с крестиком и удалением */}
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
    {task.title}
    {isCompleted && (
      <Chip 
        label="Выполнено" 
        size="small" 
        color="success" 
        sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }} 
      />
    )}
  </Typography>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="Удалить задачу">
      <IconButton 
        onClick={handleDeleteTask} 
        size="small"
        sx={{ color: 'error.main' }}
      >
        <DeleteIcon />
      </IconButton>
    </Tooltip>
    <IconButton onClick={handleClose} size="small">
      <CloseIcon />
    </IconButton>
  </Box>
</Box>

        <Divider sx={{ mb: 2 }} />

        {/* Кнопки действий */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            color={isCompleted ? 'success' : 'primary'}
            startIcon={isCompleted ? <CheckCircleIcon /> : <UncheckedIcon />}
            onClick={handleToggleComplete}
            disabled={loading}
            size="small"
            sx={{ flex: 1 }}
          >
            {isCompleted ? 'Выполнено' : 'Отметить'}
          </Button>

          <Button
            variant="outlined"
            color={isTimerActive ? 'error' : 'primary'}
            startIcon={isTimerActive ? <StopIcon /> : <PlayIcon />}
            onClick={handleToggleTimer}
            disabled={loading}
            size="small"
            sx={{ flex: 1 }}
          >
            {isTimerActive ? 'Стоп' : 'Старт'}
          </Button>
        </Stack>

        {/* Таймер */}
        <Box sx={{ mb: 2, textAlign: 'center', bgcolor: '#f5f5f5', py: 1, px: 2, borderRadius: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {formatTime(displayTotalSeconds)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Общее время работы
          </Typography>
          {isTimerActive && (
            <Typography variant="caption" color="primary" display="block">
              Текущая сессия: {formatTime(timerSeconds)}
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Дедлайн */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CalendarIcon color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Дедлайн
            </Typography>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<CalendarIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {deadlineDate ? formatDeadline(deadlineDate) : 'Установить дедлайн'}
          </Button>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <Box sx={{ p: 2, width: 300 }}>
              <DatePicker
                label="Дата"
                value={deadlineDate}
                onChange={setDeadlineDate}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
              <TimePicker
                label="Время"
                value={deadlineTime}
                onChange={setDeadlineTime}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handleDeadlineSave}
                  disabled={!deadlineDate}
                  fullWidth
                >
                  Сохранить
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleClearDeadline}
                  fullWidth
                >
                  Очистить
                </Button>
              </Stack>
            </Box>
          </Popover>

          {deadlineDate && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {format(deadlineDate, 'EEEE, d MMMM yyyy, HH:mm', { locale: ru })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Оценка времени */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <HourglassIcon color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Оценка времени
            </Typography>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<HourglassIcon />}
            onClick={(e) => setEstimatedAnchorEl(e.currentTarget)}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {formatEstimatedTime(estimatedHours, estimatedMinutes)}
          </Button>

          <Popover
            open={Boolean(estimatedAnchorEl)}
            anchorEl={estimatedAnchorEl}
            onClose={() => setEstimatedAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <Box sx={{ p: 2, width: 300 }}>
              <Typography variant="subtitle2" gutterBottom>
                Укажите ожидаемое время выполнения
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <TextField
                  label="Часы"
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Math.max(0, parseInt(e.target.value) || 0))}
                  inputProps={{ min: 0, max: 999 }}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Минуты"
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 59 }}
                  fullWidth
                  size="small"
                />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={handleEstimatedSave}
                  disabled={estimatedHours === 0 && estimatedMinutes === 0}
                  fullWidth
                >
                  Сохранить
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={handleClearEstimated}
                  fullWidth
                >
                  Очистить
                </Button>
              </Stack>
            </Box>
          </Popover>

          {(estimatedHours > 0 || estimatedMinutes > 0) && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <HourglassIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Планируется: {formatEstimatedTime(estimatedHours, estimatedMinutes)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Приоритет */}
<Box sx={{ mb: 2 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
    <FlagIcon color="action" />
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
      Приоритет
    </Typography>
  </Box>

  <FormControl fullWidth size="small" disabled={loading}>
    <Select
      value={priorityId || ''}
      onChange={(e) => handlePriorityChange(e.target.value ? Number(e.target.value) : undefined)}
      displayEmpty
      renderValue={(selected) => {
        if (!selected) {
          return <em style={{ color: '#9e9e9e' }}>Выберите приоритет</em>;
        }
        const priority = priorities.find(p => p.priority_id === selected);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon sx={{ color: priority?.color || '#9e9e9e' }} />
            <span>{priority?.priority_name}</span>
          </Box>
        );
      }}
    >
      <MenuItem value="">
        <em>Не установлен</em>
      </MenuItem>
      {priorities.map((priority) => (
        <MenuItem key={priority.priority_id} value={priority.priority_id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagIcon sx={{ color: priority.color }} />
            <span>{priority.priority_name}</span>
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  {priorityId && (
    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      <FlagIcon fontSize="small" sx={{ color: getPriorityColor(priorityId) }} />
      <Typography variant="body2" color="text.secondary">
        Приоритет: {getPriorityName(priorityId)}
      </Typography>
    </Box>
  )}
</Box>

<Divider sx={{ mb: 2 }} />
        {/* Исполнитель
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Исполнитель
            </Typography>
          </Box>

          <FormControl fullWidth size="small" disabled={loading}>
            <InputLabel>Выберите исполнителя</InputLabel>
            <Select
  value={assigneeId || ''}
  onChange={(e) => {
    console.log('Select onChange event:', e.target.value);
    console.log('Select onChange value type:', typeof e.target.value);
    handleAssigneeChange(e.target.value ? Number(e.target.value) : undefined);
  }}
>
              <MenuItem value="">
                <em>Не назначен</em>
              </MenuItem>
              {projectUsers.map((user) => (
                <MenuItem key={user.project_user_id} value={user.project_user_id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {user.user_name.charAt(0)}
                    </Avatar>
                    <span>{user.user_name}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedUserData && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                {selectedUserData.user_name.charAt(0)}
              </Avatar>
              <Typography variant="body2">
                {selectedUserData.user_name}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} /> */}

        {/* Описание задачи */}
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Описание
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionChange}
          disabled={loading}
          placeholder="Добавьте описание задачи..."
          sx={{ mb: 2 }}
        />

        {/* Подзадачи */}
        <Box sx={{ mb: 2 }}>
          <SubtaskList
            subtasks={subtasks}
            loading={subtasksLoading}
            onToggleSubtask={handleSubtaskToggleComplete}
            onSubtaskClick={(subtaskId) => {
              if (onOpenSubtask) {
                onOpenSubtask(subtaskId);
              }
            }}
            onCreateSubtask={() => {
              setCreateSubtaskOpen(true);
            }}
          />
        </Box>

        {/* Диалог создания подзадачи */}
        <Dialog open={createSubtaskOpen} onClose={() => setCreateSubtaskOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Создать подзадачу</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Название подзадачи"
              fullWidth
              variant="outlined"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Описание"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newSubtaskDescription}
              onChange={(e) => setNewSubtaskDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateSubtaskOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateSubtask} variant="contained">
              Создать
            </Button>
          </DialogActions>
        </Dialog>

        {/* История изменений */}
        <HistoryList history={history} loading={historyLoading} />
        
        {/* Комментарии */}
        <CommentsSection
          taskId={task.task_id}
          currentUserId={user?.user_id || 0}
        />
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2, 
              fontSize: '0.875rem',
              py: 0.5, 
              '& .MuiAlert-icon': { fontSize: '1.2rem' } 
            }}
          >
            {error}
          </Alert>
        )}
      </Drawer>
    </LocalizationProvider>
  );
};

export default TaskDetailsPanel;