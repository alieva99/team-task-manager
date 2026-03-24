import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

interface LoginData {
  username: string;  // email
  password: string;
}

interface RegisterData {
  email: string;
  user_name: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  // Регистрация
  register: async (data: RegisterData) => {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  },

  // Вход
  login: async (data: LoginData) => {
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};