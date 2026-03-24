import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MoveUp as MoveIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Flag as FlagIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as Icons from '@mui/icons-material';

interface HistoryItem {
  history_id: number;
  action_name: string;  // ← теперь это строка, а не объект
  task_user_id: number;
  content: {
    task_id: number;
    field?: string;
    old_value?: string;
    new_value?: string;
  };
  history_updated_at: string;
  user: {
    user_id: number;
    user_name: string;
    solution_icon: string;
  };
}

interface HistoryListProps {
  history: HistoryItem[];
  loading: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, loading }) => {
  const [open, setOpen] = useState(true);

  const getActionIcon = (actionName: string) => {
    switch (actionName) {
      case 'CREATE_TASK':
        return <AddIcon fontSize="small" />;
      case 'DELETE_TASK':
        return <DeleteIcon fontSize="small" />;
      case 'UPDATE_TITLE':
        return <EditIcon fontSize="small" />;
      case 'UPDATE_DESCRIPTION':
        return <EditIcon fontSize="small" />;
      case 'UPDATE_COLUMN_ID':
      case 'MOVE_TASK':
        return <MoveIcon fontSize="small" />;
      case 'UPDATE_IS_COMPLETED':
        return <CheckCircleIcon fontSize="small" />;
      case 'UPDATE_PRIORITY_ID':
        return <FlagIcon fontSize="small" />;
      case 'UPDATE_ASSIGNEE_ID':
        return <PersonAddIcon fontSize="small" />;
      case 'UPDATE_DEADLINE':
        return <TimeIcon fontSize="small" />;
      case 'UPDATE_ESTIMATED_TIME':
        return <TimeIcon fontSize="small" />;
      case 'UPDATE_FOCUS_TIME':
        return <TimeIcon fontSize="small" />;
      default:
        return <EditIcon fontSize="small" />;
    }
  };

  const getActionText = (item: HistoryItem): string => {
    const actionName = item.action_name;  // ← теперь прямое поле
    const content = item.content;

    switch (actionName) {
      case 'CREATE_TASK':
        return `создал(а) задачу "${content.new_value || ''}"`;
      case 'DELETE_TASK':
        return `удалил(а) задачу "${content.old_value || ''}"`;
      case 'UPDATE_TITLE':
        return `изменил(а) название с "${content.old_value || ''}" на "${content.new_value || ''}"`;
      case 'UPDATE_DESCRIPTION':
        return `изменил(а) описание`;
      case 'UPDATE_COLUMN_ID':
      case 'MOVE_TASK':
        return `переместил(а) задачу в другую колонку`;
      case 'UPDATE_IS_COMPLETED':
        return content.new_value === 'True' 
          ? `отметил(а) задачу как выполненную`
          : `снял(а) отметку о выполнении`;
      case 'UPDATE_PRIORITY_ID':
        return `изменил(а) приоритет`;
      case 'UPDATE_ASSIGNEE_ID':
        return content.new_value 
          ? `назначил(а) исполнителя`
          : `снял(а) исполнителя`;
      case 'UPDATE_DEADLINE':
        return content.new_value 
          ? `установил(а) дедлайн`
          : `удалил(а) дедлайн`;
      case 'UPDATE_ESTIMATED_TIME':
        return content.new_value 
          ? `изменил(а) оценку времени`
          : `удалил(а) оценку времени`;
      case 'UPDATE_FOCUS_TIME':
        return `добавил(а) ${content.new_value || '0'} сек. времени`;
      default:
        return `выполнил(а) действие: ${actionName}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: format(date, 'dd.MM.yyyy HH:mm:ss'),
      relative: formatDistanceToNow(date, { addSuffix: true, locale: ru })
    };
  };

  const getUserIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] || PersonIcon;
    return <IconComponent />;
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1,
            px: 1,
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              История изменений
            </Typography>
          </Box>
        </Box>
        <Box sx={{ pl: 3, pr: 1, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Загрузка истории...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            py: 1,
            px: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
          }}
          onClick={() => setOpen(!open)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon color="action" />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              История изменений
            </Typography>
          </Box>
          <IconButton size="small">
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={open}>
          <Box sx={{ pl: 3, pr: 1, py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              История изменений пока пуста
            </Typography>
          </Box>
        </Collapse>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          py: 1,
          px: 1,
          borderRadius: 1,
          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
        }}
        onClick={() => setOpen(!open)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            История изменений
          </Typography>
          <Chip
            label={history.length}
            size="small"
            sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
          />
        </Box>
        <IconButton size="small">
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ pl: 3, pr: 1, mt: 1, maxHeight: 300, overflowY: 'auto' }}>
          <List disablePadding dense>
            {history.map((item, index) => (
              <React.Fragment key={item.history_id}>
                {index > 0 && <Divider component="li" sx={{ my: 1 }} />}
                <ListItem alignItems="flex-start" disablePadding sx={{ py: 0.5 }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: 'primary.main',
                      }}
                    >
                      {getUserIcon(item.user.solution_icon)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {item.user.user_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          {getActionIcon(item.action_name)}  {/* ← используем action_name напрямую */}
                          <Typography variant="caption">
                            {getActionText(item)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Tooltip title={formatDate(item.history_updated_at).full} placement="top">
                        <Typography variant="caption" color="text.secondary" component="span">
                          {formatDate(item.history_updated_at).relative}
                        </Typography>
                      </Tooltip>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
};

export default HistoryList;