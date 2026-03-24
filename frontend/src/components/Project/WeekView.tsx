import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  SubdirectoryArrowRight as SubtasksIcon,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay, parseISO, isToday as isTodayFns } from 'date-fns';
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

interface WeekViewProps {
  tasks: Task[];
  columns: Column[];
  projectUsers: ProjectUser[];
  onTaskClick: (task: Task) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
  tasks,
  columns,
  projectUsers,
  onTaskClick,
}) => {
  const [startDate, setStartDate] = useState(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const handlePrevWeek = () => {
    setStartDate(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setStartDate(prev => addDays(prev, 7));
  };

  const handleToday = () => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.deadline) return false;
      try {
        const taskDate = parseISO(task.deadline);
        return isSameDay(taskDate, day);
      } catch {
        return false;
      }
    });
  };

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

  const isToday = (day: Date) => {
    return isTodayFns(day);
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Навигация по неделям */}
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
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevWeek} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={handleToday} size="small">
            <TodayIcon />
          </IconButton>
          <IconButton onClick={handleNextWeek} size="small">
            <ChevronRightIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'medium' }}>
            {format(weekDays[0], 'd MMMM', { locale: ru })} — {format(weekDays[6], 'd MMMM yyyy', { locale: ru })}
          </Typography>
        </Box>
      </Paper>

      {/* Контейнер для колонок с прокруткой */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
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
        <Box sx={{
          display: 'flex',
          gap: 2,
          height: '100%',
          minHeight: 'min-content',
        }}>
          {weekDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentDay = isToday(day);

            return (
              <Paper
                key={day.toISOString()}
                sx={{
                  p: 2,
                  minWidth: { xs: 280, sm: 300, md: 320 },
                  maxWidth: { xs: 280, sm: 300, md: 320 },
                  height: 'auto',
                  minHeight: 200,
                  backgroundColor: isCurrentDay ? 'rgba(25, 118, 210, 0.05)' : '#f5f5f5',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isCurrentDay ? '2px solid #1976d2' : 'none',
                  flexShrink: 0,
                }}
              >
                {/* Заголовок дня */}
                <Box sx={{ mb: 2, flexShrink: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {format(day, 'EEEE', { locale: ru })}
                  </Typography>
                  <Typography variant="h6" color={isCurrentDay ? 'primary' : 'text.secondary'}>
                    {format(day, 'd MMMM', { locale: ru })}
                  </Typography>
                  <Chip
                    label={`${dayTasks.length} задач`}
                    size="small"
                    sx={{ mt: 1, height: 20, '& .MuiChip-label': { fontSize: '0.7rem' } }}
                  />
                </Box>

                {/* Список задач дня с прокруткой */}
                <Box sx={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 100,
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '2px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '2px',
                  },
                }}>
                  {dayTasks.length > 0 ? (
                    dayTasks.map((task) => (
                      <Paper
                        key={task.task_id}
                        elevation={1}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          cursor: 'pointer',
                          bgcolor: task.parent_id ? 'rgba(0, 0, 0, 0.02)' : 'white',
                          borderLeft: '4px solid',
                          borderLeftColor: getPriorityColor(task.priority_id),
                          '&:hover': {
                            boxShadow: 3,
                            bgcolor: 'rgba(25, 118, 210, 0.04)',
                          },
                          opacity: task.is_completed ? 0.8 : 1,
                        }}
                        onClick={() => onTaskClick(task)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          {task.parent_id && (
                            <SubtasksIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: task.parent_id ? 'normal' : 'bold',
                              flex: 1,
                              textDecoration: task.is_completed ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </Typography>
                          {task.is_completed && (
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />
                          )}
                        </Box>

                        {task.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.description}
                          </Typography>
                        )}

                        {task.assignee_id && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>
                              {getAssigneeAvatar(task.assignee_id)}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              {getAssigneeName(task.assignee_id)}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))
                  ) : (
                    <Box
                      sx={{
                        height: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #ccc',
                        borderRadius: 1,
                        color: '#999',
                        fontSize: '0.9rem',
                      }}
                    >
                      Нет задач
                    </Box>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default WeekView;