import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  SubdirectoryArrowRight as SubtasksIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
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

interface TasksListViewProps {
  tasks: Task[];
  columns: Column[];
  projectUsers: ProjectUser[];
  onTaskClick: (task: Task) => void;
}

const TasksListView: React.FC<TasksListViewProps> = ({
  tasks,
  columns,
  projectUsers,
  onTaskClick,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getColumnName = (columnId: number) => {
    const column = columns.find(c => c.column_id === columnId);
    return column?.column_name || 'Неизвестно';
  };

  const getPriorityInfo = (priorityId?: number) => {
    switch (priorityId) {
      case 1:
        return { name: 'Высокий', color: '#f44336', icon: <FlagIcon sx={{ color: '#f44336' }} /> };
      case 2:
        return { name: 'Средний', color: '#ff9800', icon: <FlagIcon sx={{ color: '#ff9800' }} /> };
      case 3:
        return { name: 'Низкий', color: '#4caf50', icon: <FlagIcon sx={{ color: '#4caf50' }} /> };
      default:
        return { name: 'Не указан', color: '#9e9e9e', icon: <FlagIcon sx={{ color: '#9e9e9e' }} /> };
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru });
    } catch {
      return '-';
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  const formatEstimatedTime = (estimatedTime?: string) => {
    if (!estimatedTime) return '-';
    try {
      const date = new Date(estimatedTime);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      if (hours > 0) {
        return `${hours}ч ${minutes}м`;
      }
      return `${minutes}м`;
    } catch {
      return '-';
    }
  };

  // Простая сортировка: сначала родительские задачи, потом подзадачи
  const sortedTasks = [...tasks].sort((a, b) => {
    // Родительские задачи выше подзадач
    if (a.parent_id && !b.parent_id) return 1;
    if (!a.parent_id && b.parent_id) return -1;
    // Остальное без изменений
    return 0;
  });

  const paginatedTasks = sortedTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
<TableContainer sx={{ 
  maxHeight: 'calc(100vh - 280px)', // Адаптивная высота
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  // ... остальные стили
}}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Статус</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Колонка</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Название задачи</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Описание</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Приоритет</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Исполнитель</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Дедлайн</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Затрачено времени</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Оценка</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Подзадачи</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasks.map((task) => {
              const priority = getPriorityInfo(task.priority_id);
              const assigneeName = getAssigneeName(task.assignee_id);
              const assigneeAvatar = getAssigneeAvatar(task.assignee_id);
              const hasSubtasks = task.subtasks_count && task.subtasks_count > 0;

              return (
                <TableRow
                  key={task.task_id}
                  hover
                  sx={{
                    cursor: 'pointer',
                    bgcolor: task.parent_id ? 'rgba(0, 0, 0, 0.02)' : 'inherit',
                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' },
                  }}
                  onClick={() => onTaskClick(task)}
                >
                  {/* Статус */}
                  <TableCell>
                    {task.is_completed ? (
                      <Tooltip title="Выполнена">
                        <CheckCircleIcon sx={{ color: '#4caf50' }} />
                      </Tooltip>
                    ) : (
                      <Tooltip title="В работе">
                        <RadioButtonUncheckedIcon sx={{ color: '#ff9800' }} />
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Колонка */}
                  <TableCell>
                    <Chip
                      label={getColumnName(task.column_id)}
                      size="small"
                      sx={{ height: 24, '& .MuiChip-label': { fontSize: '0.75rem' } }}
                    />
                  </TableCell>

                  {/* Название задачи */}
                  <TableCell sx={{ fontWeight: task.parent_id ? 'normal' : 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {task.parent_id && (
                        <SubtasksIcon sx={{ fontSize: 14, color: 'text.secondary', ml: 2 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                          color: task.is_completed ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {task.title}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Описание */}
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {task.description || '-'}
                    </Typography>
                  </TableCell>

                  {/* Приоритет */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {priority.icon}
                      <Typography variant="caption">{priority.name}</Typography>
                    </Box>
                  </TableCell>

                  {/* Исполнитель */}
                  <TableCell>
                    {assigneeName ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                          {assigneeAvatar}
                        </Avatar>
                        <Typography variant="caption">{assigneeName}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>

                  {/* Дедлайн */}
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(task.deadline)}
                    </Typography>
                  </TableCell>

                  {/* Затрачено времени */}
                  <TableCell>
                    <Typography variant="caption">
                      {formatTime(task.focus_time)}
                    </Typography>
                  </TableCell>

                  {/* Оценка времени */}
                  <TableCell>
                    <Typography variant="caption">
                      {formatEstimatedTime(task.estimated_time)}
                    </Typography>
                  </TableCell>

                  {/* Подзадачи */}
                  <TableCell>
                    {hasSubtasks ? (
                      <Chip
                        label={`${task.subtasks_count}`}
                        size="small"
                        icon={<SubtasksIcon />}
                        sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem' } }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>

                  {/* Действия */}
                  <TableCell>
                    <Tooltip title="Открыть задачу">
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {tasks.length === 0 
                      ? 'В проекте пока нет задач'
                      : 'Нет задач, соответствующих выбранным фильтрам'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={tasks.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
      />
    </Paper>
  );
};

export default TasksListView;