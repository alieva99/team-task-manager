import React, { useState } from 'react';
import { Fab, Tooltip, Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { Help as HelpIcon, Close as CloseIcon } from '@mui/icons-material';

interface HelpButtonProps {
  pdfUrl: string;
}

const HelpButton: React.FC<HelpButtonProps> = ({ pdfUrl }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Плавающая кнопка */}
      <Tooltip title="Руководство пользователя" placement="left">
        <Fab
          color="default"
          aria-label="help"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            backgroundColor: '#000000',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#333333',
            },
          }}
        >
          <HelpIcon />
        </Fab>
      </Tooltip>

      {/* Диалоговое окно с PDF */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpIcon />
            <span>Руководство пользователя</span>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <iframe
            src={pdfUrl}
            title="Руководство пользователя"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpButton;