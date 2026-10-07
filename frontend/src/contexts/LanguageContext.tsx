/* eslint-disable react-refresh/only-export-components */
import { commonVi, commonEn } from '../locales/common';
import { adminVi, adminEn } from '../locales/admin';
import { teacherVi, teacherEn } from '../locales/teacher';
import { studentVi, studentEn } from '../locales/student';
import { authVi, authEn } from '../locales/auth';
import { createContext, useState, useContext } from 'react'; import type { ReactNode } from 'react';

type LanguageContextType = {
  language: string;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  const t = (key: string) => {
    const dict = {
      vi: {
        ...commonVi,
        ...adminVi,
        ...teacherVi,
        ...studentVi,
        ...authVi,
      },
      en: {
        ...commonEn,
        ...adminEn,
        ...teacherEn,
        ...studentEn,
        ...authEn,
      }
    };

    const keys = key.split('.');
    let value: unknown = dict[language];
    
    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (typeof value === 'string') return value;
    
    // If the resolved value is an object with title or label, return it
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.title === 'string') return obj.title;
      if (typeof obj.label === 'string') return obj.label;
    }

    // Fallback: If root key was shadowed by an object module (e.g., settings in authVi shadowing commonVi)
    if (key === 'settings' || key === 'menuSettings') {
      return language === 'vi' ? 'Cài đặt' : 'Settings';
    }
    if (key === 'profile' || key === 'menuProfile') {
      return language === 'vi' ? 'Hồ sơ' : 'Profile';
    }

    // Fallback: If the value is undefined or an object, return the raw key 
    // to prevent React "Objects are not valid as a child" crashes.
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
