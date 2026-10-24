/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, Role, User } from '../types/auth';
import { authService, userService, AUTH_EVENTS } from '@/api';
import type { AuthUserData } from '@/api/services/auth.service';
import type { UserProfile } from '@/api/services/user.service';
import { environment } from '@/config/environment';

const ROLES: Role[] = ['admin', 'teacher', 'student'];

const toUser = (data: AuthUserData | null): User | null => {
  if (!data) return null;
  const role = data.role?.toLowerCase() as Role;
  return {
    ...data,
    fullName: data.fullName ?? '',
    email: data.email ?? '',
    role: ROLES.includes(role) ? role : 'student',
  };
};

const profileToUser = (profile: UserProfile): User => {
  const role = profile.role.toLowerCase() as Role;
  const validRole: Role = ROLES.includes(role) ? role : 'student';
  const roleCode = profile.studentCode || (
    validRole === 'teacher' ? `GV-${String(profile.id).padStart(3, '0')}` :
    validRole === 'admin' ? `AD-${String(profile.id).padStart(3, '0')}` :
    `HV-${String(profile.id).padStart(3, '0')}`
  );

  return {
    id: profile.id,
    fullName: profile.fullName || '',
    email: profile.email || '',
    role: validRole,
    avatar: profile.avatarUrl,
    phone: profile.phone,
    specialization: profile.specialization,
    code: roleCode,
    dateOfBirth: profile.dateOfBirth,
  };
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (authService.isAuthenticated()) {
        const saved = authService.getSavedUser();
        return toUser(saved);
      }
    } catch {
      // Fallback
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const savedUser = authService.getSavedUser();
          if (savedUser && isMounted) {
            setUser(toUser(savedUser));
          }

          // Fetch freshest user profile from backend
          try {
            const profile = await userService.getMyProfile();
            if (isMounted) {
              const freshUser = profileToUser(profile);
              setUser(freshUser);
              localStorage.setItem(environment.auth.userKey, JSON.stringify(freshUser));
            }
          } catch (profileErr) {
            // Keep savedUser if profile request fails (network error, transient failure)
            console.warn('Could not fetch fresh user profile, using cached session:', profileErr);
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('initAuth error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
      authService.clearSession();
    };

    window.addEventListener(AUTH_EVENTS.EXPIRED, handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_EVENTS.EXPIRED, handleAuthExpired);
    };
  }, []);

  const login = async (payload: { email: string; password: string }): Promise<User | null> => {
    const response = await authService.login(payload);
    const initialUser = toUser(response.user);
    if (initialUser) {
      setUser(initialUser);
    }

    try {
      const fullProfile = await userService.getMyProfile();
      const enrichedUser = profileToUser(fullProfile);
      setUser(enrichedUser);
      localStorage.setItem(environment.auth.userKey, JSON.stringify(enrichedUser));
      return enrichedUser;
    } catch {
      // Retain initial login user
      return initialUser;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout encountered error, local session cleared:', err);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem(environment.auth.userKey, JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
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

export { useAuth } from '../hooks/useAuth';
