import React from 'react';
import { LayoutDashboard, History, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import AIAvatar from '../ai/AIAvatar';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="w-64 h-screen fixed top-0 left-0 bg-gradient-to-b from-slate-900 to-blue-950 text-white flex flex-col shadow-2xl z-20">

      {/* =====================================================
          MOCKMIND AI LOGO
          UNCHANGED
      ===================================================== */}

      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          MockMind AI
        </h1>
      </div>

      {/* =====================================================
          NAVIGATION
          UNCHANGED
      ===================================================== */}

      <nav className="px-4 mt-8 space-y-2">

        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive && item.path === '/dashboard'
                  ? 'bg-white/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />

            <span className="font-medium">
              {item.name}
            </span>
          </NavLink>
        ))}

      </nav>

      {/* =====================================================
          TASK 13 — AI AVATAR AREA
          Only avatar.
          No text.
          No chat box.
          No buttons.
          No logout.
      ===================================================== */}

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <AIAvatar />
      </div>

    </div>
  );
};

export default Sidebar;