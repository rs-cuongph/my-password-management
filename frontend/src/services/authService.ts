import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from './api';
import { useAuthStore } from '../stores/authStore';
import type { LoginInput, RegisterInput, UserProfileInput } from '../schemas/auth';
import type { User, ApiResponse } from '../types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Types
interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

interface RegisterResponse {
  user: User;
  message: string;
}

// API functions
const authApi = {
  login: (data: LoginInput): Promise<ApiResponse<LoginResponse>> =>
    apiService.post('/auth/login', data),

  register: (data: RegisterInput): Promise<ApiResponse<RegisterResponse>> =>
    apiService.post('/auth/register', data),

  logout: (): Promise<ApiResponse<{ message: string }>> =>
    apiService.post('/auth/logout'),

  getMe: (): Promise<ApiResponse<User>> =>
    apiService.get('/auth/me'),

  updateProfile: (data: UserProfileInput): Promise<ApiResponse<User>> =>
    apiService.put('/auth/profile', data),

  refreshToken: (refreshToken: string): Promise<ApiResponse<{ access_token: string }>> =>
    apiService.post('/auth/refresh', { refresh_token: refreshToken }),
};

// Custom hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      const { user, access_token } = response.data;
      login(user, access_token);

      // Set user data in cache
      queryClient.setQueryData(authKeys.me(), user);

      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();

      // Clear all cached data
      queryClient.clear();

      // Redirect to login page
      window.location.href = '/login';
    },
    onSettled: () => {
      // Always logout locally, even if API call fails
      logout();
      queryClient.clear();
    },
  });
};

export const useMe = () => {
  const { isAuthenticated, token } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getMe,
    enabled: isAuthenticated && !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (response) => {
      const updatedUser = response.data;

      // Update user in auth store
      const { setUser } = useAuthStore.getState();
      setUser(updatedUser);

      // Update cached user data
      queryClient.setQueryData(authKeys.me(), updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  const { setToken } = useAuthStore();

  return useMutation({
    mutationFn: ({ refreshToken }: { refreshToken: string }) =>
      authApi.refreshToken(refreshToken),
    onSuccess: (response) => {
      const { access_token } = response.data;
      setToken(access_token);

      // Invalidate all queries to refetch with new token
      queryClient.invalidateQueries();
    },
    onError: () => {
      // If refresh fails, logout user
      const { logout } = useAuthStore.getState();
      logout();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};