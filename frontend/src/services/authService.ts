import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from './api';
import { useAuthStore } from '../stores/authStore';
import type { LoginInput, RegisterInput, UserProfileInput, TOTPSetupInput, TOTPVerificationInput } from '../schemas/auth';
import type { User, ApiResponse } from '../types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Types
interface LoginResponse {
  success: boolean;
  tempToken?: string;
  need2fa: boolean;
  kdfSalt: string;
  message?: string;
}

interface RegisterResponse {
  user: User;
  message: string;
}

interface TOTPSetupResponse {
  success: boolean;
  otpauthUri: string;
  qrCode?: string;
  message?: string;
}

interface TOTPVerificationResponse {
  success: boolean;
  accessToken?: string;
  kdfSalt?: string;
  message?: string;
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

  refreshToken: (): Promise<ApiResponse<LoginResponse>> =>
    apiService.post('/auth/refresh'),

  setupTOTP: (data: TOTPSetupInput): Promise<ApiResponse<TOTPSetupResponse>> =>
    apiService.post('/auth/setup-2fa', data),

  verifyTOTP: (data: TOTPVerificationInput): Promise<ApiResponse<TOTPVerificationResponse>> =>
    apiService.post('/auth/verify-2fa', data),
};

// Custom hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      const { success, tempToken, kdfSalt, need2fa } = response.data;
      
      if (success && tempToken) {
        // Store kdfSalt in sessionStorage for master password page
        sessionStorage.setItem('kdfSalt', kdfSalt);
        
        if (need2fa) {
          // Redirect to TOTP verification page
          setTimeout(() => {
            window.location.href = '/totp-verification';
          }, 100);
        } else {
          // Get user info and complete login
          try {
            const userResponse = await authApi.getMe();
            const user = { ...userResponse.data, kdfSalt };
            login(user, tempToken);
            
            // Set user data in cache
            queryClient.setQueryData(authKeys.me(), user);
            
            // Invalidate and refetch user queries
            queryClient.invalidateQueries({ queryKey: authKeys.all });
            
            // Redirect to master password page after successful login
            setTimeout(() => {
              window.location.href = '/master-password';
            }, 100);
          } catch (error) {
            console.error('Failed to get user info:', error);
            // Still redirect to master password page with kdfSalt
            setTimeout(() => {
              window.location.href = '/master-password';
            }, 100);
          }
        }
      }
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
    mutationFn: () => authApi.refreshToken(),
    onSuccess: (response) => {
      const { tempToken } = response.data;
      setToken(tempToken || '');

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

export const useSetupTOTP = () => {
  return useMutation({
    mutationFn: authApi.setupTOTP,
    onError: (error) => {
      console.error('TOTP setup failed:', error);
    },
  });
};

export const useVerifyTOTP = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: authApi.verifyTOTP,
    onSuccess: async (response) => {
      if (response.data.success && response.data.accessToken) {
        const { accessToken, kdfSalt } = response.data;
        
        // Store kdfSalt in sessionStorage for master password page
        if (kdfSalt) {
          sessionStorage.setItem('kdfSalt', kdfSalt);
        }
        
        // Get user from store or make API call to get user info
        const { user } = useAuthStore.getState();
        if (user) {
          const userWithSalt = { ...user, kdfSalt };
          login(userWithSalt, accessToken);
          queryClient.invalidateQueries({ queryKey: authKeys.all });
          
          // Redirect to master password page
          setTimeout(() => {
            window.location.href = '/master-password';
          }, 100);
        }
      }
    },
    onError: (error) => {
      console.error('TOTP verification failed:', error);
    },
  });
};