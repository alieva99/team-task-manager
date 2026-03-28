import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DragHandle as DragHandleIcon,
  CheckCircle as CheckCircleIcon,
  SubdirectoryArrowRight as SubtaskIcon,
} from '@mui/icons-material';
import { tasksApi } from '../../services/api';

interface Task {
  task_id: number;
  title: string;
  description?: string;
  deadline?: string;
  is_completed?: boolean;
  priority_id?: number;
}

interface Subtask {
  task_id: number;
  title: string;
  is_completed: boolean;
}

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
  level?: number;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  onClick,
  level = 0,
}) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtasksLoading, setSubtasksLoading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.task_id });

  useEffect(() => {
    // Загружаем подзадачи для этой задачи
    fetchSubtasks();
  }, [task.task_id]);

  const getOverdueStatus = (task: Task) => {
  if (!task.deadline || task.is_completed) return null;
  const now = new Date();
  const deadlineDate = new Date(task.deadline);
  if (deadlineDate < now) {
    const diffTime = Math.abs(now.getTime() - deadlineDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days: diffDays, text: `${diffDays} дн.` };
  }
  return null;
};

  const fetchSubtasks = async () => {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    marginBottom: '8px',
    marginLeft: level > 0 ? `${level * 24}px` : 0,
  };

  const isCompleted = task.is_completed === true;
  const completedSubtasksCount = subtasks.filter(s => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasksCount / subtasks.length) * 100 : 0;

  return (
    <Box ref={setNodeRef} style={style}>
      <Card
        {...attributes}
        {...listeners}
        onClick={onClick}
        sx={{
          '&:hover': {
            boxShadow: 3,
          },
          opacity: isCompleted ? 0.8 : 1,
          backgroundColor: isCompleted ? '#f0fdf4' : 'white',
          borderLeft: isCompleted ? '4px solid #4caf50' : 'none',
          borderLeftColor: task.priority_id === 1 ? '#f44336' : 
                          task.priority_id === 2 ? '#ff9800' : 
                          task.priority_id === 3 ? '#4caf50' : 'transparent',
          borderLeftWidth: task.priority_id ? '4px' : 'none',
          borderLeftStyle: 'solid',
        }}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Основная задача */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DragHandleIcon sx={{ color: 'text.secondary', fontSize: 18, cursor: 'grab' }} />
            {getOverdueStatus(task) && (
  <Chip
    label={getOverdueStatus(task)?.text}
    size="small"
    color="error"
    sx={{
      height: 20,
      '& .MuiChip-label': { fontSize: '0.65rem', px: 1 },
      backgroundColor: '#f44336',
      color: 'white',
      fontWeight: 'bold',
    }}
  />
)}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'bold',
                flex: 1,
                textDecoration: isCompleted ? 'line-through' : 'none',
                color: isCompleted ? 'text.secondary' : 'text.primary',
              }}
            >
              {task.title}
            </Typography>
            {isCompleted && (
              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
            )}
            {subtasks.length > 0 && (
              <Chip
                label={`${completedSubtasksCount}/${subtasks.length}`}
                size="small"
                color={completedSubtasksCount === subtasks.length ? 'success' : 'default'}
                sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
              />
            )}
          </Box>

          {task.description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', ml: 3.5 }}>
              {task.description.length > 40
                ? `${task.description.substring(0, 40)}...`
                : task.description}
            </Typography>
          )}

          {task.deadline && (
            <Chip
              label={new Date(task.deadline).toLocaleDateString()}
              size="small"
              sx={{ mt: 0.5, ml: 3.5, height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 1 } }}
            />
          )}

          {/* Прогресс-бар подзадач */}
          {subtasks.length > 0 && (
            <Box sx={{ mt: 1, ml: 3.5, mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 3,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                  },
                }}
              />
            </Box>
          )}

          {/* Список подзадач - ТОЛЬКО если они есть */}
          {subtasks.length > 0 && (
            <List disablePadding dense sx={{ mt: 1, ml: 3.5 }}>
              {subtasks.map((subtask) => (
                <ListItem
                  key={subtask.task_id}
                  disablePadding
                  sx={{ py: 0.25 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
                    <SubtaskIcon sx={{ fontSize: 14, color: 'text.secondary', ml: 0.5 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        flex: 1,
                        textDecoration: subtask.is_completed ? 'line-through' : 'none',
                        color: subtask.is_completed ? 'text.secondary' : 'text.primary',
                        fontSize: '0.75rem',
                      }}
                    >
                      {subtask.title}
                    </Typography>
                    {subtask.is_completed && (
                      <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 14 }} />
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SortableTaskCard;