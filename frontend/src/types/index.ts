export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  kdfSalt?: string; // Salt for client-side key derivation
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
