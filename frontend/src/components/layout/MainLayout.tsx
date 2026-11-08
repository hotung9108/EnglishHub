import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout-wrapper">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Persistent Single Sidebar */}
      <Sidebar isOpen={sidebarOpen} onCloseMobile={closeSidebar} />

      {/* Full-Bleed Content Area */}
      <div className="layout-main">
        {/* Mobile Header (Hidden on Desktop >= 769px) */}
        <header className="mobile-header">
          <button 
            type="button" 
            className="mobile-header-menu-btn" 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="mobile-header-brand">
            <img src="/logo-icon.png" alt="EnglishHub" className="mobile-header-logo" />
            <span className="mobile-header-title">EnglishHub</span>
          </div>
        </header>

        <main
          className="page-content"
          onClick={() => {
            if (sidebarOpen && window.innerWidth <= 768) {
              closeSidebar();
            }
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
