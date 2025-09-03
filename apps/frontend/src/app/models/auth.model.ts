export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
}
