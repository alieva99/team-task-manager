import React from 'react';
import {
  Popover,
  Box,
  IconButton,
  Grid,
  Paper,
  Typography,
} from '@mui/material';

// Простые эмодзи (не требуют установки библиотек)
const EMOJIS = [
  '😊', '😂', '😍', '🥳', '😎', '😢', '😡', '🤔',
  '👍', '👎', '👏', '🙏', '🔥', '✨', '⭐', '💯',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🎉', '🎈', '🎊', '🎁', '🎂', '🍕', '🍔', '🌮',
  '🐛', '🚀', '💻', '📱', '🔧', '⚙️', '📝', '✅',
  '❌', '⚠️', '❓', '❗', '💡', '🔔', '📌', '🏆',
];

interface StickerPickerProps {
  onSelect: (sticker: string) => void;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, anchorEl, onClose }) => {
  const open = Boolean(anchorEl);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
    >
      <Paper sx={{ p: 2, maxWidth: 320, maxHeight: 400, overflow: 'auto' }}>
        <Typography variant="subtitle2" gutterBottom>
          Выберите эмодзи
        </Typography>
        <Grid container spacing={1}>
          {EMOJIS.map((emoji, index) => (
            <Grid item key={index}>
              <IconButton
                onClick={() => handleEmojiClick(emoji)}
                sx={{
                  fontSize: '24px',
                  width: 44,
                  height: 44,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                {emoji}
              </IconButton>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Popover>
  );
};

export default StickerPicker;