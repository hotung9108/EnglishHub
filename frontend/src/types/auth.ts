export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  code?: string;
  department?: string;
  specialization?: string;
  bio?: string;
  meetingUrl?: string;
  targetBand?: string;
  currentClass?: string;
  dateOfBirth?: string;
  school?: string;
  joinedDate?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}
