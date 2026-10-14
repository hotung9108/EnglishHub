import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getPageTitle, formatDocumentTitle, DEFAULT_FULL_TITLE } from '../../utils/pageTitle';

/**
 * Global component that synchronizes the browser tab's `document.title`
 * with the active route and selected language whenever the location or language changes.
 */
export const DocumentTitleManager: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname, (language as 'vi' | 'en') || 'vi');
    if (pageTitle) {
      document.title = formatDocumentTitle(pageTitle);
    } else {
      document.title = DEFAULT_FULL_TITLE;
    }
  }, [location.pathname, language]);

  return null;
};

export default DocumentTitleManager;
