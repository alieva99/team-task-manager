import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface User {
  user_id: number;
  email: string;
  user_name: string;
  solution_name: string;
  solution_icon: string;
  solution_settings: Record<string, any>;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // При инициализации пробуем загрузить из localStorage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('https://team-task-manager-api-wk16.onrender.com/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error fetching user:', error);
      // Если ошибка, удаляем токен и перенаправляем на логин
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    try {
      const response = await axios.put('https://team-task-manager-api-wk16.onrender.com/api/v1/users/me', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Загружаем данные при монтировании, если есть токен
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, updateUser, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};