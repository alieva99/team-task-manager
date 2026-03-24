import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  ExitToApp as ExitToAppIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { projectsApi, notificationsApi } from '../../services/api';
import * as Icons from '@mui/icons-material';
import InviteUserDialog from './InviteUserDialog';

interface LeftNavigationBarProps {
  open: boolean;
  onToggle: () => void;
}

interface Project {
  project_id: number;
  project_name: string;
  created_at: string;
}

// Список доступных иконок для решения
const availableIcons = [
  'Dashboard', 'Task', 'Assignment', 'Work', 'Business', 'School', 'Home',
  'Star', 'Favorite', 'Lightbulb', 'Settings', 'People', 'Group', 'Person',
];

// Список доступных аватарок для пользователя
const availableAvatars = [
  'Person', 'Face', 'EmojiEmotions', 'SmartToy', 'Pets', 'AcUnit',
  'Whatshot', 'MusicNote', 'SportsEsports', 'LocalPizza',
];

const LeftNavigationBar: React.FC<LeftNavigationBarProps> = ({ open, onToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, updateUser, refreshUser } = useUser();
  const navigate = useNavigate();
  
  // ... все состояния остаются теми же ...
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [solutionName, setSolutionName] = useState('');
  const [solutionIcon, setSolutionIcon] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Загрузка проектов
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  useEffect(() => {
    if (user) {
      setSolutionName(user.solution_name);
      setSolutionIcon(user.solution_icon);
      setUserName(user.user_name);
      setUserAvatar(user.solution_icon || 'Person');
    }
  }, [user]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await projectsApi.getProjects();
      setProjects(response.data);
      setFilteredProjects(response.data);
    } catch (err) {
      console.error('Ошибка загрузки проектов:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err);
    }
  };

  // ... остальные функции (handleCreateProject, handleEditProject и т.д.) ...

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError('Название проекта не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await projectsApi.createProject({
        project_name: newProjectName,
      });

      setSuccess('Проект создан!');
      setNewProjectName('');
      setCreateProjectOpen(false);
      
      await fetchProjects();
      
      setTimeout(() => {
        navigate(`/project/${response.data.project_id}`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при создании проекта');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProject = async () => {
    if (!editingProject) return;
    if (!editProjectName.trim()) {
      setError('Название проекта не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await projectsApi.updateProject(editingProject.project_id, {
        project_name: editProjectName,
      });

      setSuccess('Проект обновлен!');
      setEditProjectOpen(false);
      setEditingProject(null);
      setEditProjectName('');
      
      await fetchProjects();
      
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при обновлении проекта');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setSaving(true);
    setError('');

    try {
      await projectsApi.deleteProject(projectToDelete.project_id);

      setSuccess('Проект удален!');
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      
      await fetchProjects();
      
      if (window.location.pathname.includes(`/project/${projectToDelete.project_id}`)) {
        navigate('/dashboard');
      }
      
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при удалении проекта');
    } finally {
      setSaving(false);
    }
  };

  const handleProjectMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    setProjectMenuAnchor(event.currentTarget);
    setSelectedProject(project);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleEditClick = () => {
    if (selectedProject) {
      setEditingProject(selectedProject);
      setEditProjectName(selectedProject.project_name);
      setEditProjectOpen(true);
    }
    handleProjectMenuClose();
  };

  const handleDeleteClick = () => {
    if (selectedProject) {
      setProjectToDelete(selectedProject);
      setDeleteDialogOpen(true);
    }
    handleProjectMenuClose();
  };

  const handleSaveSettings = async () => {
    if (!solutionName.trim()) {
      setError('Название не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      await updateUser({
        solution_name: solutionName,
        solution_icon: solutionIcon,
      });
      
      await refreshUser();
      
      setSuccess('Настройки сохранены');
      setTimeout(() => {
        setSuccess('');
        setSettingsOpen(false);
      }, 1500);
    } catch (err) {
      setError('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      setError('Имя не может быть пустым');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      await updateUser({
        user_name: userName,
        solution_icon: userAvatar,
      });
      
      await refreshUser();
      
      setSuccess('Профиль обновлен');
      setTimeout(() => {
        setSuccess('');
        setProfileOpen(false);
      }, 1500);
    } catch (err) {
      setError('Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_type');
    navigate('/login');
  };

  const handleInviteClick = () => {
    setInviteDialogOpen(true);
  };

  const handleInviteSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!user) {
    return (
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? { xs: 240, md: 280 } : { xs: 56, md: 72 },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? { xs: 240, md: 280 } : { xs: 56, md: 72 },
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
            backgroundColor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <CircularProgress size={40} />
      </Drawer>
    );
  }

  const IconComponent = Icons[solutionIcon as keyof typeof Icons] || DashboardIcon;
  const UserAvatarIcon = Icons[userAvatar as keyof typeof Icons] || PersonIcon;

  const drawerContent = (
    <>
      {/* Верхняя часть */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: open ? 2 : 1,
        minHeight: 64,
      }}>
        {open ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => setSettingsOpen(true)}
              >
                <IconComponent sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  {solutionName}
                </Typography>
              </Box>
              
            </Box>
            <IconButton onClick={onToggle} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <IconButton onClick={() => setSettingsOpen(true)} sx={{ mb: 1 }}>
              <IconComponent sx={{ color: 'primary.main' }} />
            </IconButton>
            <IconButton onClick={onToggle}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      
      <Divider />
      
      {/* Поиск проектов */}
      {open && (
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск проектов"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}
      
      {/* Кнопки действий */}
      {open ? (
        <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            fullWidth
            size="small"
            onClick={handleInviteClick}
            sx={{ textTransform: 'none' }}
          >
            Пригласить
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            fullWidth
            size="small"
            onClick={() => setSettingsOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Настройки
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
          <Tooltip title="Пригласить" placement="right">
            <IconButton size="small" onClick={handleInviteClick}>
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Настройки" placement="right">
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      <Divider />
      
      {/* Список проектов */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            ПРОЕКТЫ
          </Typography>
          <Tooltip title="Создать проект">
            <IconButton size="small" onClick={() => setCreateProjectOpen(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {projectsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 3,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover', borderRadius: 2 }
            }}
            onClick={() => setCreateProjectOpen(true)}
          >
            <WorkIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'Проекты не найдены' : 'Создайте первый проект'}
            </Typography>
            {!searchQuery && (
              <Button size="small" sx={{ mt: 1, textTransform: 'none' }}>
                + Создать
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {filteredProjects.map((project) => (
              <ListItem
                key={project.project_id}
                disablePadding
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={(e) => handleProjectMenuOpen(e, project)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                }
              >
                <ListItemButton 
                  onClick={() => navigate(`/project/${project.project_id}`)}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemText 
                    primary={project.project_name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontWeight: 500 }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      
      <Divider />
      
      {/* Профиль */}
      {/* Нижняя часть - профиль (кликабельно) */}
{/* Нижняя часть - профиль (кликабельно) */}
<Box 
  sx={{ 
    p: open ? 2 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: open ? 'flex-start' : 'center',
    gap: 1,
    cursor: 'pointer',
    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
  }}
  onClick={() => setProfileOpen(true)}
>
  <Avatar 
    src="/images/avatar.jpg"
    sx={{ 
      width: 40, 
      height: 40,
      bgcolor: 'primary.main',
    }}
  />
  {open && (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {user?.user_name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {user?.email}
      </Typography>
    </Box>
  )}
</Box>
    </>
  );

  return (
    <>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={onToggle}
        sx={{
          width: open ? { xs: 240, md: 280 } : { xs: 56, md: 72 },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? { xs: 240, md: 280 } : { xs: 56, md: 72 },
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
            backgroundColor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Все диалоги остаются такими же */}
      <Menu
        anchorEl={projectMenuAnchor}
        open={Boolean(projectMenuAnchor)}
        onClose={handleProjectMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Редактировать
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      <Dialog open={settingsOpen} onClose={() => !saving && setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Настройки решения</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            fullWidth
            label="Название решения"
            value={solutionName}
            onChange={(e) => setSolutionName(e.target.value)}
            margin="normal"
            disabled={saving}
          />
          
          {/* <FormControl fullWidth margin="normal" disabled={saving}>
            <InputLabel>Иконка</InputLabel>
            <Select
              value={solutionIcon}
              onChange={(e) => setSolutionIcon(e.target.value)}
              label="Иконка"
            >
              {availableIcons.map((iconName) => {
                const Icon = Icons[iconName as keyof typeof Icons];
                return (
                  <MenuItem key={iconName} value={iconName}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon fontSize="small" />
                      <span>{iconName}</span>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleSaveSettings} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={profileOpen} onClose={() => !saving && setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            <span>Личный кабинет</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            fullWidth
            label="Email"
            value={user?.email || ''}
            margin="normal"
            disabled={true}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          <TextField
            fullWidth
            label="Имя пользователя"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            margin="normal"
            disabled={saving}
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          

        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleLogout}
            startIcon={<ExitToAppIcon />}
          >
            Выйти
          </Button>
          <Box>
            <Button onClick={() => setProfileOpen(false)} disabled={saving} sx={{ mr: 1 }}>
              Отмена
            </Button>
            <Button onClick={handleSaveProfile} variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Сохранить'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog open={createProjectOpen} onClose={() => !saving && setCreateProjectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создание нового проекта</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            autoFocus
            fullWidth
            label="Название проекта"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            margin="normal"
            disabled={saving}
            placeholder="Например: Разработка сайта"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProjectOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleCreateProject} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editProjectOpen} onClose={() => !saving && setEditProjectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактирование проекта</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            autoFocus
            fullWidth
            label="Название проекта"
            value={editProjectName}
            onChange={(e) => setEditProjectName(e.target.value)}
            margin="normal"
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditProjectOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleEditProject} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => !saving && setDeleteDialogOpen(false)}>
        <DialogTitle>Удаление проекта</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            Вы уверены, что хотите удалить проект "{projectToDelete?.project_name}"?
            <br />
            <strong>Это действие нельзя отменить!</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        projects={projects}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
};

export default LeftNavigationBar;