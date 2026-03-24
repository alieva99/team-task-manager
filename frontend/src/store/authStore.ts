import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authApi } from '../services/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ username: email, password });
      const { access_token, token_type } = response.data;
      const token = `${token_type} ${access_token}`;
      
      localStorage.setItem('token', token);
      // You might want to decode token to get user info
      // or make a separate request to /me
      
      set({ token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, userName: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({ email, user_name: userName, password });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));