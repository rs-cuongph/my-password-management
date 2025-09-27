import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from './api';
import { useAuthStore } from '../stores/authStore';
import { useMasterPasswordStore } from '../stores/masterPasswordStore';
import type {
  LoginInput,
  RegisterApiInput,
  TOTPSetupInput,
  TOTPVerificationInput,
} from '../schemas/auth';
import type { User } from '../types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// Types
interface LoginResponse {
  success: boolean;
  tempToken?: string; // For 2FA verification
  accessToken?: string; // For direct login (no 2FA)
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
  login: (data: LoginInput): Promise<LoginResponse> =>
    apiService.post('/auth/login', data),

  register: (data: RegisterApiInput): Promise<RegisterResponse> =>
    apiService.post('/auth/register', data),

  getMe: (): Promise<User> => apiService.get('/auth/me'),

  setupTOTP: (data: TOTPSetupInput): Promise<TOTPSetupResponse> =>
    apiService.post('/auth/setup-2fa', data),

  verifyTOTP: (
    data: TOTPVerificationInput
  ): Promise<TOTPVerificationResponse> =>
    apiService.post('/auth/verify-2fa', data),
};

// Custom hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();
  const { clear } = useMasterPasswordStore();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      const { success, tempToken, accessToken, kdfSalt, need2fa } = response;

      if (success) {
        // Clear master password store for fresh login
        clear();

        // Store kdfSalt in sessionStorage for master password page
        sessionStorage.setItem('kdfSalt', kdfSalt);

        if (accessToken) {
          // Direct login without 2FA
          localStorage.setItem('token', accessToken);

          // Create temporary user object with kdfSalt
          const tempUser = {
            id: '',
            email: '',
            name: '',
            createdAt: '',
            updatedAt: '',
            kdfSalt,
          };
          login(tempUser, accessToken);

          // Invalidate and refetch user queries (useMe will be called by AuthContext)
          queryClient.invalidateQueries({ queryKey: authKeys.all });

          // ProtectedRoute will automatically redirect to master-password page
        } else if (tempToken && need2fa) {
          // 2FA required - store tempToken and redirect to TOTP verification
          localStorage.setItem('token', tempToken);

          // Redirect to TOTP verification page
          setTimeout(() => {
            window.location.href = '/totp-verification';
          }, 100);
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
  const { clear } = useMasterPasswordStore();

  return useMutation({
    mutationFn: authApi.verifyTOTP,
    onSuccess: async (response) => {
      if (response.success && response.accessToken) {
        // Clear master password store for fresh login
        clear();

        const { accessToken, kdfSalt } = response;

        // Store accessToken in localStorage
        localStorage.setItem('token', accessToken);

        // Store kdfSalt in sessionStorage for master password page
        if (kdfSalt) {
          sessionStorage.setItem('kdfSalt', kdfSalt);
        }

        // Create temporary user object with kdfSalt
        const tempUser = {
          id: '',
          email: '',
          name: '',
          createdAt: '',
          updatedAt: '',
          kdfSalt: kdfSalt || '',
        };
        login(tempUser, accessToken);

        // Invalidate and refetch user queries (useMe will be called by AuthContext)
        queryClient.invalidateQueries({ queryKey: authKeys.all });

        // ProtectedRoute will automatically redirect to master-password page
      }
    },
    onError: (error) => {
      console.error('TOTP verification failed:', error);
    },
  });
};
