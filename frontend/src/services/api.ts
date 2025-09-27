import axios from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1';

export const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export const apiService = {
  get: <T = any>(url: string): Promise<T> => api.get(url),
  post: <T = any>(url: string, data?: any): Promise<T> => api.post(url, data),
  put: <T = any>(url: string, data?: any): Promise<T> => api.put(url, data),
  delete: <T = any>(url: string): Promise<T> => api.delete(url),
};
