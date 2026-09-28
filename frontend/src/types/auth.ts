export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  specialization?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}
