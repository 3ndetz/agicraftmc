import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,

  // Вход
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login({ username, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, loading: false });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка входа';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Регистрация
  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, loading: false });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка регистрации';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Проверка токена при загрузке
  verifyToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const response = await authAPI.verify();
      set({ user: response.data.user, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // Выход
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
