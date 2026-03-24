import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

import theme from './theme/theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import MainLayout from './components/Layout/MainLayout';
import HelpButton from './components/UI/HelpButton';

// Компонент для защиты маршрутов
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <PrivateRoute>
                  <MainLayout>
                    <ProjectPage />
                  </MainLayout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
        <HelpButton pdfUrl="/images/user-guide.pdf" />
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;