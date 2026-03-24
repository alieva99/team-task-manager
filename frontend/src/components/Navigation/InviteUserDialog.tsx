import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { projectsApi } from '../../services/api';

interface Project {
  project_id: number;
  project_name: string;
}

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onSuccess: (message: string) => void;
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onClose,
  projects,
  onSuccess,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Сброс формы при открытии/закрытии
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedProjectId('');
        setEmail('');
        setError('');
        setSuccess('');
      }, 200);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      setError('Выберите проект');
      return;
    }
    
    if (!email.trim()) {
      setError('Введите email пользователя');
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await projectsApi.inviteUser(selectedProjectId as number, email);
      
      const projectName = projects.find(p => p.project_id === selectedProjectId)?.project_name;
      setSuccess(`Пользователь с email ${email} приглашен в проект "${projectName}"`);
      
      // Очищаем форму после успеха
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при приглашении пользователя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Пригласить пользователя в проект</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <FormControl fullWidth margin="normal" disabled={loading}>
          <InputLabel>Проект</InputLabel>
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value as number)}
            label="Проект"
          >
            {projects.map((project) => (
              <MenuItem key={project.project_id} value={project.project_id}>
                {project.project_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="normal"
          label="Email пользователя"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="user@example.com"
          helperText="Пользователь должен быть зарегистрирован в системе"
        />

        <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Приглашенный пользователь получит доступ к проекту как обычный участник (не администратор).
            Он сможет создавать и редактировать задачи, но не сможет управлять настройками проекта.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !selectedProjectId || !email}
        >
          {loading ? <CircularProgress size={24} /> : 'Пригласить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteUserDialog;