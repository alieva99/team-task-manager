import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { notesApi } from '../../services/api';
import CommentItem from './CommentItem';
import StickerPicker from './StickerPicker';

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

interface CommentsSectionProps {
  taskId: number;
  currentUserId: number;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ taskId, currentUserId }) => {
  const [open, setOpen] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [stickerAnchorEl, setStickerAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskId) {
      fetchComments();
    }
  }, [taskId]);

  useEffect(() => {
    // Скролл к последнему комментарию при открытии
    if (open && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, comments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await notesApi.getNotes(taskId);
      setComments(response.data);
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err);
      setError('Не удалось загрузить комментарии');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if ((!newComment.trim() && selectedFiles.length === 0) || sending) return;

    setSending(true);
    setError('');

    try {
      const content: any = {};
      
      if (newComment.trim()) {
        content.text = newComment;
      }

      if (selectedFiles.length > 0) {
        // Здесь нужно будет реализовать загрузку файлов на сервер
        // Пока сохраняем как заглушку
        content.files = selectedFiles.map(file => ({
          name: file.name,
          url: URL.createObjectURL(file), // Временный URL
          type: file.type,
          size: file.size,
        }));
      }

      const response = await notesApi.createNote({
        task_id: taskId,
        content: content,
      });

      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      setSelectedFiles([]);
      
      // Очищаем input файлов
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Ошибка отправки комментария:', err);
      setError(err.response?.data?.detail || 'Ошибка при отправке комментария');
    } finally {
      setSending(false);
    }
  };

  const handleStickerSelect = (sticker: string) => {
    setSending(true);
    
    // Отправляем стикер как отдельный комментарий
    notesApi.createNote({
      task_id: taskId,
      content: { sticker },
    })
      .then(response => {
        setComments(prev => [response.data, ...prev]);
      })
      .catch(err => {
        console.error('Ошибка отправки стикера:', err);
        setError('Ошибка при отправке стикера');
      })
      .finally(() => {
        setSending(false);
      });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendComment();
    }
  };

  const handleEditComment = async (commentId: number, newText: string) => {
    try {
      const comment = comments.find(c => c.noted_id === commentId);
      if (!comment) return;

      const response = await notesApi.updateNote(commentId, {
        content: {
          ...comment.content,
          text: newText,
        },
      });

      setComments(prev =>
        prev.map(c => (c.noted_id === commentId ? response.data : c))
      );
    } catch (err) {
      console.error('Ошибка редактирования комментария:', err);
      setError('Ошибка при редактировании комментария');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await notesApi.deleteNote(commentId);
      setComments(prev => prev.filter(c => c.noted_id !== commentId));
    } catch (err) {
      console.error('Ошибка удаления комментария:', err);
      setError('Ошибка при удалении комментария');
    }
  };

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
          <CommentIcon color="action" />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Комментарии
          </Typography>
          {comments.length > 0 && (
            <Badge
              badgeContent={comments.length}
              color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 18, minWidth: 18 } }}
            />
          )}
        </Box>
        <IconButton size="small">
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ pl: 3, pr: 1 }}>
          {/* Список комментариев */}
          <Box
            sx={{
            maxHeight: 400,
            overflowY: 'auto',
            mb: 2,
            pr: 1,
            display: 'flex',
            flexDirection: 'column', // Старые сверху, новые снизу
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : comments.length > 0 ? (
              <Box>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.noted_id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                  />
                ))}
                <div ref={commentsEndRef} />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Нет комментариев. Будьте первым!
              </Typography>
            )}
          </Box>

          {/* Ошибка */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Выбранные файлы */}
          {selectedFiles.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {selectedFiles.map((file, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 0.5,
                    px: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="caption">{file.name}</Typography>
                  <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          )}

          {/* Поле ввода */}
          <Paper variant="outlined" sx={{ p: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder="Напишите комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              variant="standard"
              InputProps={{
                disableUnderline: true,
              }}
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <Tooltip title="Прикрепить файл">
                <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Добавить стикер">
                <IconButton
                  size="small"
                  onClick={(e) => setStickerAnchorEl(e.currentTarget)}
                  disabled={sending}
                >
                  <EmojiIcon />
                </IconButton>
              </Tooltip>

              <Box sx={{ flex: 1 }} />

              <Button
                variant="contained"
                size="small"
                endIcon={<SendIcon />}
                onClick={handleSendComment}
                disabled={(!newComment.trim() && selectedFiles.length === 0) || sending}
              >
                Отправить
              </Button>
            </Box>
          </Paper>
        </Box>
      </Collapse>

      {/* Пайкер стикеров */}
      <StickerPicker
        anchorEl={stickerAnchorEl}
        onClose={() => setStickerAnchorEl(null)}
        onSelect={handleStickerSelect}
      />
    </Box>
  );
};

export default CommentsSection;