import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar fixed on the left */}
      <Sidebar />
      
      {/* Main content shifted right to accommodate sidebar */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header />
        
        {/* Page Content area */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;








