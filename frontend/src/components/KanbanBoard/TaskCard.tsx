import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onFullscreen: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onFullscreen }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.task_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    marginBottom: 1,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {task.title}
          </Typography>
          <Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFullscreen();
              }}
            >
              <FullscreenIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {task.description}
          </Typography>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {task.deadline && (
            <Chip
              label={new Date(task.deadline).toLocaleDateString()}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {task.priority_id === 1 && (
            <Chip label="High" size="small" color="error" />
          )}
          {task.priority_id === 2 && (
            <Chip label="Medium" size="small" color="warning" />
          )}
          {task.priority_id === 3 && (
            <Chip label="Low" size="small" color="success" />
          )}
        </Box>
      </CardContent>
      
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
        <MenuItem onClick={handleMenuClose}>Add Note</MenuItem>
        <MenuItem onClick={handleMenuClose}>View History</MenuItem>
      </Menu>
    </Card>
  );
};

export default TaskCard;