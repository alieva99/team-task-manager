import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SubdirectoryArrowRight as SubtaskIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface Subtask {
  task_id: number;
  title: string;
  is_completed: boolean;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  loading: boolean;
  onToggleSubtask: (subtaskId: number, completed: boolean) => void;
  onSubtaskClick: (subtaskId: number) => void;
  onCreateSubtask: () => void;
  showCreateButton?: boolean;
}

const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  loading,
  onToggleSubtask,
  onSubtaskClick,
  onCreateSubtask,
  showCreateButton = true,
}) => {
  const [open, setOpen] = React.useState(true);

  const completedCount = subtasks.filter(s => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  if (subtasks.length === 0 && !showCreateButton) {
    return null;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 0.5,
          px: 1,
          borderRadius: 1,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
        }}
        onClick={() => setOpen(!open)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SubtaskIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Подзадачи
          </Typography>
          {subtasks.length > 0 && (
            <Chip
              label={`${completedCount}/${subtasks.length}`}
              size="small"
              color={completedCount === subtasks.length ? 'success' : 'default'}
              sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
            />
          )}
        </Box>
        <IconButton size="small">
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ pl: 3, pr: 1 }}>
          {/* Прогресс-бар */}
          {subtasks.length > 0 && (
            <Box sx={{ my: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                  },
                }}
              />
            </Box>
          )}

          {/* Список подзадач */}
          {subtasks.length > 0 ? (
            <List disablePadding dense>
              {subtasks.map((subtask) => (
                <ListItem
                  key={subtask.task_id}
                  disablePadding
                  secondaryAction={
                    <Tooltip title="Открыть подзадачу">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSubtaskClick(subtask.task_id);
                        }}
                      >
                        <SubtaskIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton
                    onClick={() => onToggleSubtask(subtask.task_id, !subtask.is_completed)}
                    dense
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Checkbox
                        edge="start"
                        checked={subtask.is_completed}
                        size="small"
                        sx={{ p: 0.5 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={subtask.title}
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: {
                          textDecoration: subtask.is_completed ? 'line-through' : 'none',
                          color: subtask.is_completed ? 'text.secondary' : 'text.primary',
                          fontSize: '0.85rem',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1 }}>
              Нет подзадач
            </Typography>
          )}

          {/* Кнопка создания подзадачи (только если разрешено) */}
          {showCreateButton && (
            <Box
              onClick={onCreateSubtask}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.5,
                px: 1,
                mt: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                  color: 'primary.main',
                },
              }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                Создать подзадачу
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SubtaskList;