/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User } from '../types/auth';
import { authService, tokenStorage, AUTH_EVENTS } from '@/api';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const savedUser = authService.getSavedUser();
          if (savedUser) {
            setUser(savedUser);
          }
        }
      } catch {
        tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
      tokenStorage.clearTokens();
    };

    window.addEventListener(AUTH_EVENTS.EXPIRED, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EVENTS.EXPIRED, handleAuthExpired);
    };
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    const response = await authService.login(payload);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
