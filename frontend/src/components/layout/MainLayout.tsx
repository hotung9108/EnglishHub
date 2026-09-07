import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { LanguageProvider } from '../../contexts/LanguageContext';

const MainLayout = ({ role }: { role?: string }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <LanguageProvider>
      <div className="layout-wrapper">
        <Sidebar isOpen={sidebarOpen} role={role as 'admin' | 'teacher' | 'student'} />
        <div className="layout-main">
          <TopBar toggleSidebar={toggleSidebar} />
          <main
            className="page-content"
            onClick={() => {
              if (sidebarOpen && window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
};

export default MainLayout;
