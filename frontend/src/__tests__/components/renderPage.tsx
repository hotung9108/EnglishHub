/* eslint-disable react-refresh/only-export-components -- test helpers are not application components */
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';

function Language({ language, children }: { language: string; children: ReactNode }) {
  const { language: current, toggleLanguage } = useLanguage();
  useEffect(() => {
    if (language === 'en' && current !== language) toggleLanguage();
  }, [current, language, toggleLanguage]);
  return language === 'vi' || current === language ? children : null;
}

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

export function renderPage(page: ReactElement, path: string, entry = path, state?: object, language = 'vi') {
  return render(
    <LanguageProvider>
      <Language language={language}>
        <MemoryRouter initialEntries={[{ pathname: entry.split('?')[0], search: entry.split('?')[1] ? `?${entry.split('?')[1]}` : '', state }]}>
          <Location />
          <Routes>
            <Route path={path} element={page} />
            <Route path="*" element={<div>Destination</div>} />
          </Routes>
        </MemoryRouter>
      </Language>
    </LanguageProvider>,
  );
}
