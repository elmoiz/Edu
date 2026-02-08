import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
          });
          
          const { token, ...user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false
          });
          return false;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, userData);
          
          const { token, ...user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return true;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
        delete axios.defaults.headers.common['Authorization'];
      },

      updateProfile: async (profileData) => {
        try {
          const response = await axios.put(`${API_URL}/auth/profile`, profileData);
          set({ user: { ...get().user, ...response.data } });
          return true;
        } catch (error) {
          return false;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      }
    }
  )
);