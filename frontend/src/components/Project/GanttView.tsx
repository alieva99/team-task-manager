import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  SubdirectoryArrowRight as SubtasksIcon,
} from '@mui/icons-material';
import {
  format,
  addDays,
  subDays,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ru } from 'date-fns/locale';

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
  assignee_id?: number;
  parent_id?: number;
  subtasks_count?: number;
  order_index_task?: number;  // Добавьте эту строку
}

interface Column {
  column_id: number;
  column_name: string;
}

interface ProjectUser {
  user_id: number;
  user_name: string;
  email: string;
  solution_icon: string;
  project_user_id: number;
}

interface GanttViewProps {
  tasks: Task[];
  columns: Column[];
  projectUsers: ProjectUser[];
  onTaskClick: (task: Task) => void;
}

const GanttView: React.FC<GanttViewProps> = ({
  tasks,
  columns,
  projectUsers,
  onTaskClick,
}) => {
  const [zoom, setZoom] = useState(30); // Ширина одного дня в пикселях
  const [showWeekends, setShowWeekends] = useState(true);
  const [startDate, setStartDate] = useState(() => startOfMonth(new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  // Генерируем диапазон дат для отображения (2 месяца)
  const dateRange = eachDayOfInterval({
    start: startDate,
    end: endOfMonth(addDays(startDate, 60)), // 2 месяца
  }).filter(date => showWeekends ? true : ![0, 6].includes(date.getDay()));

  const getPriorityColor = (priorityId?: number) => {
    switch (priorityId) {
      case 1: return '#f44336';
      case 2: return '#ff9800';
      case 3: return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getAssigneeName = (assigneeId?: number) => {
    if (!assigneeId) return null;
    const user = projectUsers.find(u => u.project_user_id === assigneeId);
    return user?.user_name || null;
  };

  const getAssigneeAvatar = (assigneeId?: number) => {
    if (!assigneeId) return null;
    const user = projectUsers.find(u => u.project_user_id === assigneeId);
    return user?.user_name?.charAt(0) || '?';
  };

  const getTaskPosition = (task: Task) => {
    if (!task.deadline && !task.estimated_time) return null;

    let start: Date;
    let end: Date;

    if (task.estimated_time) {
      // Если есть оценка времени, используем её как длительность
      const estimated = parseISO(task.estimated_time);
      const durationHours = estimated.getHours() + estimated.getMinutes() / 60;
      const durationDays = Math.ceil(durationHours / 8); // 8-часовой рабочий день
      
      start = task.deadline ? parseISO(task.deadline) : new Date();
      end = addDays(start, durationDays);
    } else if (task.deadline) {
      // Если только дедлайн, задача длится 1 день
      start = parseISO(task.deadline);
      end = start;
    } else {
      return null;
    }

    const startIndex = dateRange.findIndex(d => isSameDay(d, start));
    const endIndex = dateRange.findIndex(d => isSameDay(d, end));

    if (startIndex === -1 || endIndex === -1) return null;

    return {
      left: startIndex * zoom,
      width: (endIndex - startIndex + 1) * zoom,
    };
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 5, 60));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 5, 15));
  };

  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft -= 200;
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += 200;
    }
  };

  // Сортируем задачи: родительские сначала, потом подзадачи
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.parent_id && !b.parent_id) return 1;
    if (!a.parent_id && b.parent_id) return -1;
    return 0;
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Панель управления */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          mb: 2,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Уменьшить масштаб">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Slider
              value={zoom}
              onChange={(_, value) => setZoom(value as number)}
              min={15}
              max={60}
              step={5}
              sx={{ width: 150 }}
            />
            <Tooltip title="Увеличить масштаб">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={showWeekends}
                onChange={(e) => setShowWeekends(e.target.checked)}
                size="small"
              />
            }
            label="Выходные"
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={handleScrollLeft} size="small">
              ←
            </IconButton>
            <IconButton onClick={handleScrollRight} size="small">
              →
            </IconButton>
          </Box>
        </Box>

        <Typography variant="subtitle2" color="text.secondary">
          Ширина дня: {zoom}px
        </Typography>
      </Paper>

      {/* Контейнер диаграммы Ганта */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
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
        }}
      >
        <Box sx={{ position: 'relative', minWidth: dateRange.length * zoom }}>
          {/* Заголовок с датами */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
            {/* Колонка с названиями задач */}
            <Box sx={{ width: 250, flexShrink: 0, p: 1, fontWeight: 'bold' }}>
              Задачи
            </Box>
            
            {/* Даты */}
            <Box sx={{ display: 'flex' }}>
              {dateRange.map((date, index) => (
                <Box
                  key={date.toISOString()}
                  sx={{
                    width: zoom,
                    textAlign: 'center',
                    borderLeft: index > 0 ? '1px solid #e0e0e0' : 'none',
                    bgcolor: [0, 6].includes(date.getDay()) ? 'rgba(0,0,0,0.02)' : 'transparent',
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    {format(date, 'dd')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>
                    {format(date, 'E', { locale: ru })}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Строки задач */}
          {sortedTasks.map((task, taskIndex) => {
            const position = getTaskPosition(task);
            if (!position) return null;

            return (
              <Box
                key={task.task_id}
                sx={{
                  display: 'flex',
                  borderBottom: '1px solid #e0e0e0',
                  bgcolor: taskIndex % 2 === 0 ? 'white' : 'rgba(0,0,0,0.02)',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                {/* Колонка с названием задачи */}
                <Box
                  onClick={() => onTaskClick(task)}
                  sx={{
                    width: 250,
                    flexShrink: 0,
                    p: 1,
                    cursor: 'pointer',
                    borderRight: '1px solid #e0e0e0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {task.parent_id && (
                      <SubtasksIcon sx={{ fontSize: 14, color: 'text.secondary', ml: 1 }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: task.parent_id ? 'normal' : 'medium',
                        textDecoration: task.is_completed ? 'line-through' : 'none',
                        color: task.is_completed ? 'text.secondary' : 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.title}
                    </Typography>
                  </Box>
                  {task.assignee_id && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Avatar sx={{ width: 16, height: 16, fontSize: '0.5rem' }}>
                        {getAssigneeAvatar(task.assignee_id)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {getAssigneeName(task.assignee_id)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Область с диаграммой */}
                <Box sx={{ position: 'relative', flex: 1 }}>
                  {/* Линии сетки по дням */}
                  <Box sx={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    {dateRange.map((date, index) => (
                      <Box
                        key={date.toISOString()}
                        sx={{
                          width: zoom,
                          borderLeft: index > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                          bgcolor: [0, 6].includes(date.getDay()) ? 'rgba(0,0,0,0.02)' : 'transparent',
                        }}
                      />
                    ))}
                  </Box>

                  {/* Полоса задачи */}
                  {position && (
                    <Box
                      onClick={() => onTaskClick(task)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: position.left,
                        width: position.width,
                        height: 32,
                        bgcolor: `${getPriorityColor(task.priority_id)}22`,
                        border: `2px solid ${getPriorityColor(task.priority_id)}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          boxShadow: 3,
                          filter: 'brightness(0.95)',
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: getPriorityColor(task.priority_id),
                          fontWeight: 'bold',
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Легенда */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          mt: 2,
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#f4433622', border: '2px solid #f44336', borderRadius: '2px' }} />
          Высокий приоритет
        </Typography>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#ff980022', border: '2px solid #ff9800', borderRadius: '2px' }} />
          Средний приоритет
        </Typography>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 16, bgcolor: '#4caf5022', border: '2px solid #4caf50', borderRadius: '2px' }} />
          Низкий приоритет
        </Typography>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />
          Выполнено
        </Typography>
      </Paper>
    </Box>
  );
};

export default GanttView;