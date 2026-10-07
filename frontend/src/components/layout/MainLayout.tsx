import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout-wrapper">
      <Sidebar isOpen={sidebarOpen} />
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
  );
};

export default MainLayout;
