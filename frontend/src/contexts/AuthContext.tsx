/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const enrichUserData = (userData: User): User => {
    if (userData.role === 'admin') {
      return {
        code: 'AD-2026-001',
        phone: '0901 234 567',
        department: 'Ban Quản trị Hệ thống',
        joinedDate: '15/01/2025',
        ...userData,
      };
    }
    if (userData.role === 'teacher') {
      return {
        code: 'GV-2026-088',
        phone: '0987 654 321',
        specialization: 'IELTS Academic & Speaking/Writing',
        bio: '8.5 IELTS Overall (Speaking 8.5, Writing 8.0). Hơn 7 năm kinh nghiệm luyện thi IELTS học thuật và giảng dạy chuyên sâu tại EnglishHub.',
        meetingUrl: 'https://meet.google.com/eh-lan-ielts',
        joinedDate: '01/08/2024',
        ...userData,
      };
    }
    return {
      code: 'HV-2026-402',
      phone: '0912 888 999',
      currentClass: 'IELTS Intensive K24',
      targetBand: '7.5+ IELTS',
      school: 'Đại học Quốc Gia',
      dateOfBirth: '2005-06-15',
      joinedDate: '10/02/2026',
      ...userData,
    };
  };

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (!storedUser) return null;
    try {
      const parsed = JSON.parse(storedUser);
      return enrichUserData(parsed);
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);

  const login = (userData: User) => {
    const enriched = enrichUserData(userData);
    setUser(enriched);
    localStorage.setItem('mockUser', JSON.stringify(enriched));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem('mockUser', JSON.stringify(updated));
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
