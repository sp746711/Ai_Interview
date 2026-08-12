import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen bg-[#020817]">
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-8 bg-[#020817]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;