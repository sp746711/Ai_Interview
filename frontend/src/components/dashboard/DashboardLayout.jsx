import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#070809] text-[#f5f1ec] flex font-sans selection:bg-[#f3a078]/30 selection:text-white relative overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative overflow-x-hidden bg-[#070809]">
        
        {/* ===================================================
            TOP-RIGHT CINEMATIC AMBIENT WARM LIGHT SOURCE
            Simulates warm ambient light entering a luxury dark room.
            Strongest near upper-right outside corner, softly spreads
            across header/profile and fades toward center & left.
        ==================================================== */}
        <div 
          className="fixed top-[-100px] right-[-100px] w-[960px] h-[720px] pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse at 85% 15%, rgba(201, 121, 80, 0.12) 0%, rgba(168, 94, 61, 0.07) 35%, rgba(138, 75, 50, 0.025) 65%, transparent 85%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Secondary gentle top environmental spread */}
        <div
          className="fixed top-0 right-0 left-64 h-[440px] pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 950px 380px at 75% 0%, rgba(201, 121, 80, 0.06) 0%, rgba(138, 75, 50, 0.015) 50%, transparent 80%)',
          }}
        />

        {/* Soft lower vignette keeping bottom & left predominantly deep dark charcoal */}
        <div 
          className="fixed inset-0 left-64 pointer-events-none z-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 35%, rgba(7, 8, 9, 0.45) 75%, rgba(7, 8, 9, 0.85) 100%)',
          }}
        />

        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;