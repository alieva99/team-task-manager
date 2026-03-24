import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  ButtonGroup,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ViewList as ListIcon,
  ViewWeek as WeekIcon,
  CalendarMonth as MonthIcon,
  Timeline as GanttIcon,
} from '@mui/icons-material';

interface ProjectHeaderProps {
  projectName: string;
  isCompleted: boolean;
  taskCount: number;
  completedTaskCount: number;
  currentView: 'overview' | 'board' | 'list' | 'week' | 'month' | 'gantt';
  onViewChange: (view: 'overview' | 'board' | 'list' | 'week' | 'month' | 'gantt') => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectName,
  isCompleted,
  taskCount,
  completedTaskCount,
  currentView,
  onViewChange,
}) => {
  const getProjectStatus = () => {
    if (taskCount === 0) return 'В работе';
    return isCompleted ? 'Выполнен' : 'В работе';
  };

  const getStatusColor = () => {
    if (taskCount === 0) return 'warning';
    return isCompleted ? 'success' : 'info';
  };

  const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
      }}
    >
      {/* Верхняя часть - название и статус */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            {projectName}
          </Typography>
          
          <Chip
            label={getProjectStatus()}
            color={getStatusColor()}
            size="small"
            sx={{ height: 24 }}
          />

          {taskCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Задач: {taskCount}
              </Typography>
              <Box sx={{ width: 80, height: 4, bgcolor: '#e0e0e0', borderRadius: 2 }}>
                <Box
                  sx={{
                    width: `${progress}%`,
                    height: '100%',
                    bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                    borderRadius: 2,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Нижняя часть - только навигация по видам */}
      <ButtonGroup variant="outlined" size="small">
        <Button
          startIcon={<DashboardIcon />}
          variant={currentView === 'overview' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('overview')}
        >
          Обзор
        </Button>
        <Button
          startIcon={<DashboardIcon />}
          variant={currentView === 'board' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('board')}
        >
          Доски
        </Button>
        <Button
          startIcon={<ListIcon />}
          variant={currentView === 'list' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('list')}
        >
          Список
        </Button>
        <Button
          startIcon={<WeekIcon />}
          variant={currentView === 'week' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('week')}
        >
          Неделя
        </Button>
        <Button
          startIcon={<MonthIcon />}
          variant={currentView === 'month' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('month')}
        >
          Месяц
        </Button>
        <Button
          startIcon={<GanttIcon />}
          variant={currentView === 'gantt' ? 'contained' : 'outlined'}
          onClick={() => onViewChange('gantt')}
        >
          Гант
        </Button>
      </ButtonGroup>
    </Paper>
  );
};

export default ProjectHeader;