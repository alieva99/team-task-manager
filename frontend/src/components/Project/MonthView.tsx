import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Badge,
  Grid,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  SubdirectoryArrowRight as SubtasksIcon,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
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

interface MonthViewProps {
  tasks: Task[];
  columns: Column[];
  projectUsers: ProjectUser[];
  onTaskClick: (task: Task) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  tasks,
  columns,
  projectUsers,
  onTaskClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Получаем все дни месяца с учетом дней из предыдущего и следующего месяца
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Неделя начинается с понедельника
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
      }
      rows.push(days);
      days = [];
    }

    return rows;
  };

  // Получаем задачи для конкретного дня
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

  const calendarRows = renderCalendar();
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // В MonthView.tsx найдите корневой Box и обновите:

return (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 1,
    height: '100%',
    pb: 2,
  }}>
    {/* Заголовок с навигацией - сделайте его фиксированным */}
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 2,
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={handleToday} size="small">
            <TodayIcon />
          </IconButton>
          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {format(currentDate, 'LLLL yyyy', { locale: ru })}
        </Typography>
      </Box>

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
        {weekDays.map((day, index) => (
          <Typography
            key={day}
            variant="caption"
            sx={{
              width: 30,
              textAlign: 'center',
              fontWeight: index >= 5 ? 'bold' : 'normal',
              color: index >= 5 ? 'error.main' : 'text.primary',
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>
    </Paper>

    {/* Календарная сетка */}
    <Box sx={{ flex: 1, overflow: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        minHeight: 'min-content',
      }}>
        {calendarRows.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            {week.map((day, dayIndex) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <Paper
                  key={day.toISOString()}
                  elevation={0}
                  sx={{
                    p: { xs: 0.5, sm: 1 },
                    backgroundColor: isCurrentDay
                      ? 'rgba(25, 118, 210, 0.1)'
                      : isCurrentMonth
                      ? '#f9f9f9'
                      : '#f0f0f0',
                    border: isCurrentDay ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: { xs: 80, sm: 100, md: 120 },
                    maxHeight: { xs: 100, sm: 140, md: 180 },
                    overflow: 'hidden',
                    opacity: isCurrentMonth ? 1 : 0.5,
                  }}
                >
                  {/* Заголовок дня */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isCurrentDay ? 'bold' : 'medium',
                        color: isCurrentDay ? 'primary.main' : 'text.primary',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    {dayTasks.length > 0 && (
                      <Badge
                        badgeContent={dayTasks.length}
                        color="primary"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                      />
                    )}
                  </Box>

                  {/* Список задач дня */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '2px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#ccc',
                        borderRadius: '1px',
                      },
                    }}
                  >
                    {dayTasks.slice(0, 3).map((task) => (
                      <Box
                        key={task.task_id}
                        onClick={() => onTaskClick(task)}
                        sx={{
                          p: 0.5,
                          mb: 0.5,
                          cursor: 'pointer',
                          bgcolor: task.is_completed ? 'rgba(76, 175, 80, 0.1)' : 'white',
                          borderLeft: '3px solid',
                          borderLeftColor: getPriorityColor(task.priority_id),
                          borderRadius: '4px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.05)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          {task.parent_id && (
                            <SubtasksIcon sx={{ fontSize: 10, color: 'text.secondary' }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              flex: 1,
                              fontWeight: task.parent_id ? 'normal' : 'medium',
                              textDecoration: task.is_completed ? 'line-through' : 'none',
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.title}
                          </Typography>
                          {task.assignee_id && (
                            <Tooltip title={getAssigneeName(task.assignee_id)}>
                              <Avatar
                                sx={{
                                  width: { xs: 12, sm: 14 },
                                  height: { xs: 12, sm: 14 },
                                  fontSize: '0.4rem',
                                  bgcolor: 'primary.light',
                                }}
                              >
                                {getAssigneeAvatar(task.assignee_id)}
                              </Avatar>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    ))}
                    {dayTasks.length > 3 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          textAlign: 'center',
                          fontSize: { xs: '0.55rem', sm: '0.6rem' },
                          mt: 0.3,
                        }}
                      >
                        +{dayTasks.length - 3} еще
                      </Typography>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);
};

export default MonthView;