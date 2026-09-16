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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = dict[language];
    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = value[k];
    }
    
    if (typeof value === 'string') return value;
    if (value !== undefined) return value; // Return object if matched exactly
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
