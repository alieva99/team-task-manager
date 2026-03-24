import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import LeftNavigationBar from '../Navigation/LeftNavigationBar';
import { UserProvider } from '../../context/UserContext';
import HelpButton from '../UI/HelpButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [navOpen, setNavOpen] = useState(!isMobile);

// Путь к PDF файлу - поместите файл в папку public
  const pdfUrl = '/user-manual.pdf'; // файл должен лежать в frontend/public/user-manual.pdf

  // Адаптивное поведение для мобильных устройств
  React.useEffect(() => {
    if (isMobile) {
      setNavOpen(false);
    } else {
      setNavOpen(true);
    }
  }, [isMobile]);

  return (
    <UserProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <LeftNavigationBar 
          open={navOpen} 
          onToggle={() => setNavOpen(!navOpen)} 
        />
        <Box 
          component="main"
          sx={{ 
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            transition: 'margin 0.3s ease',
            width: '100%',
            overflowX: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
      <HelpButton pdfUrl={pdfUrl} />
    </UserProvider>
  );
};

export default MainLayout;