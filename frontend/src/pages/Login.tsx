import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { authApi } from '../services/api';
import axios from 'axios';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Форма регистрации
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Форма входа
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (regPassword !== regConfirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (regPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      await authApi.register({
        email: regEmail,
        user_name: regName,
        password: regPassword,
      });

      setSuccess('Регистрация успешна! Теперь можно войти.');
      
      setRegEmail('');
      setRegName('');
      setRegPassword('');
      setRegConfirmPassword('');

      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({
        username: loginEmail,
        password: loginPassword,
      });
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('token_type', response.data.token_type);
      
      const userResponse = await axios.get('http://localhost:8000/api/v1/users/me', {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: 'url("/images/background.jpg")',  // ← путь к изображению
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',  // затемнение для читаемости текста
          zIndex: 1,
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)', // полупрозрачный белый фон
          }}
        >
          <Typography variant="h4" align="center" sx={{ mb: 3 }}>
            {isLogin ? 'Вход в систему' : 'Регистрация'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {isLogin ? (
            // Форма входа
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                margin="normal"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Войти'}
              </Button>
            </form>
          ) : (
            // Форма регистрации
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Имя пользователя"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                margin="normal"
                helperText="Минимум 6 символов"
              />
              <TextField
                fullWidth
                label="Подтверждение пароля"
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
                margin="normal"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
              </Button>
            </form>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
            >
              {isLogin
                ? 'Нет аккаунта? Зарегистрироваться'
                : 'Уже есть аккаунт? Войти'}
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;