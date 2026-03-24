import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { projectsApi } from '../../services/api';

interface Column {
  column_id: number;
  column_name: string;
  order_index_column: number;
}

interface ColumnHeaderProps {
  column: Column;
  taskCount: number;
  onAddTask: () => void;
  onColumnUpdated: () => void;
  onColumnDeleted: () => void;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  taskCount,
  onAddTask,
  onColumnUpdated,
  onColumnDeleted,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState(column.column_name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditName(column.column_name);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      setError('Название не может быть пустым');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await projectsApi.updateColumn(column.column_id, {
        column_name: editName,
      });
      setEditDialogOpen(false);
      onColumnUpdated();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      await projectsApi.deleteColumn(column.column_id);
      setDeleteDialogOpen(false);
      onColumnDeleted();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {column.column_name} ({taskCount})
        </Typography>
        <Box>
          <IconButton size="small" onClick={onAddTask}>
            <AddIcon />
          </IconButton>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Редактировать
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      {/* Диалог редактирования */}
      <Dialog open={editDialogOpen} onClose={() => !loading && setEditDialogOpen(false)}>
        <DialogTitle>Редактировать колонку</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Название колонки"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            margin="normal"
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            Отмена
          </Button>
          <Button onClick={handleEditSave} variant="contained" disabled={loading}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => !loading && setDeleteDialogOpen(false)}>
        <DialogTitle>Удаление колонки</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            Вы уверены, что хотите удалить колонку "{column.column_name}"?
            {taskCount > 0 && (
              <>
                <br />
                <br />
                <strong style={{ color: 'red' }}>
                  В этой колонке есть задачи ({taskCount}). 
                  Сначала переместите или удалите их.
                </strong>
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained" 
            disabled={loading || taskCount > 0}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ColumnHeader;