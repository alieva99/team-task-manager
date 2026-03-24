import React from 'react';
import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
} from '@mui/material';
import {
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

interface ProjectFiltersProps {
  deadlineFilter: string;
  onDeadlineFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  deadlineFilter,
  onDeadlineFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const handleDeadlineChange = (event: SelectChangeEvent) => {
    onDeadlineFilterChange(event.target.value);
  };

  const handlePriorityChange = (event: SelectChangeEvent) => {
    onPriorityFilterChange(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    onStatusFilterChange(event.target.value);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getDeadlineLabel = (value: string) => {
    switch (value) {
      case '1day': return '1 день';
      case '2days': return '2 дня';
      case 'week': return 'Неделя';
      case 'month': return 'Месяц';
      default: return 'Все';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: '#f5f5f5',
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        borderRadius: 2,
      }}
    >
      {/* Фильтр по дедлайну */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Дедлайн</InputLabel>
        <Select
          value={deadlineFilter}
          label="Дедлайн"
          onChange={handleDeadlineChange}
        >
          <MenuItem value="all">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" />
              <span>Все</span>
            </Box>
          </MenuItem>
          <MenuItem value="1day">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: '#f44336' }} />
              <span>Остался 1 день</span>
            </Box>
          </MenuItem>
          <MenuItem value="2days">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: '#ff9800' }} />
              <span>Осталось 2 дня</span>
            </Box>
          </MenuItem>
          <MenuItem value="week">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: '#4caf50' }} />
              <span>Осталась неделя</span>
            </Box>
          </MenuItem>
          <MenuItem value="month">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ color: '#2196f3' }} />
              <span>Остался месяц</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* Фильтр по приоритету */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Приоритет</InputLabel>
        <Select
          value={priorityFilter}
          label="Приоритет"
          onChange={handlePriorityChange}
        >
          <MenuItem value="all">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon fontSize="small" />
              <span>Все</span>
            </Box>
          </MenuItem>
          <MenuItem value="high">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon sx={{ color: getPriorityColor('high') }} />
              <span>Высокий</span>
            </Box>
          </MenuItem>
          <MenuItem value="medium">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon sx={{ color: getPriorityColor('medium') }} />
              <span>Средний</span>
            </Box>
          </MenuItem>
          <MenuItem value="low">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FlagIcon sx={{ color: getPriorityColor('low') }} />
              <span>Низкий</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* Фильтр по статусу */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Статус задачи</InputLabel>
        <Select
          value={statusFilter}
          label="Статус задачи"
          onChange={handleStatusChange}
        >
          <MenuItem value="all">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Все задачи</span>
            </Box>
          </MenuItem>
          <MenuItem value="completed">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: '#4caf50' }} />
              <span>Выполненные</span>
            </Box>
          </MenuItem>
          <MenuItem value="active">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RadioButtonUncheckedIcon sx={{ color: '#ff9800' }} />
              <span>Активные</span>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* Активные фильтры */}
      {(deadlineFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {deadlineFilter !== 'all' && (
            <Chip
              label={`Дедлайн: ${getDeadlineLabel(deadlineFilter)}`}
              size="small"
              onDelete={() => onDeadlineFilterChange('all')}
            />
          )}
          {priorityFilter !== 'all' && (
            <Chip
              label={`Приоритет: ${priorityFilter === 'high' ? 'Высокий' : priorityFilter === 'medium' ? 'Средний' : 'Низкий'}`}
              size="small"
              onDelete={() => onPriorityFilterChange('all')}
            />
          )}
          {statusFilter !== 'all' && (
            <Chip
              label={statusFilter === 'completed' ? 'Выполненные' : 'Активные'}
              size="small"
              onDelete={() => onStatusFilterChange('all')}
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ProjectFilters;