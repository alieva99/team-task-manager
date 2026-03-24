import React from 'react';
import { Box, Typography } from '@mui/material';

const Dashboard = () => {
  return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Добро пожаловать в Team Task Manager!
        </Typography>
        <Typography variant="body1">
          Здесь будет отображаться общая информация о ваших проектах.
        </Typography>
      </Box>
  );
};

export default Dashboard;