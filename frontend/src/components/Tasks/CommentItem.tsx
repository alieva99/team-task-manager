import React from 'react';
import {
  Box,
  Avatar,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as Icons from '@mui/icons-material';

interface Comment {
  noted_id: number;
  task_id: number;
  content: {
    text?: string;
    sticker?: string;
    files?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
  created_at: string;
  updated_at?: string;
  user?: {
    user_id: number;
    user_name: string;
    solution_icon: string;
  };
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: number;
  onEdit?: (commentId: number, newText: string) => void;
  onDelete?: (commentId: number) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(comment.content.text || '');

  const isOwnComment = comment.user?.user_id === currentUserId;
  const userName = comment.user?.user_name || 'Пользователь';
  const userIcon = comment.user?.solution_icon || 'Person';

  const getUserIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] || Icons.Person;
    return <IconComponent />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: format(date, 'dd.MM.yyyy HH:mm:ss'),
      relative: formatDistanceToNow(date, { addSuffix: true, locale: ru })
    };
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(comment.noted_id);
    }
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (onEdit && editText.trim()) {
      onEdit(comment.noted_id, editText);
    }
    setIsEditing(false);
  };

  const handleFileDownload = (file: { name: string; url: string }) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon />;
    }
    return <FileIcon />;
  };

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
        }}
      >
        {getUserIcon(userIcon)}
      </Avatar>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {userName}
          </Typography>
          <Tooltip title={formatDate(comment.created_at).full}>
            <Typography variant="caption" color="text.secondary">
              {formatDate(comment.created_at).relative}
            </Typography>
          </Tooltip>
          {isOwnComment && (
            <>
              <IconButton size="small" onClick={handleMenuOpen} sx={{ ml: 'auto' }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleEdit}>Редактировать</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                  Удалить
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>

        {isEditing ? (
          <Box sx={{ mt: 1 }}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '60px',
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" variant="contained" onClick={handleSaveEdit}>
                Сохранить
              </Button>
              <Button size="small" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Текст комментария */}
            {comment.content.text && (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {comment.content.text}
              </Typography>
            )}

            {/* Стикер */}
            {comment.content.sticker && (
              <Box sx={{ fontSize: '48px', my: 1 }}>
                {comment.content.sticker}
              </Box>
            )}

            {/* Прикрепленные файлы */}
            {comment.content.files && comment.content.files.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {comment.content.files.map((file, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                    }}
                    onClick={() => handleFileDownload(file)}
                  >
                    {getFileIcon(file.type)}
                    <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>
                      {file.name}
                    </Typography>
                    <DownloadIcon fontSize="small" color="action" />
                  </Paper>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default CommentItem;