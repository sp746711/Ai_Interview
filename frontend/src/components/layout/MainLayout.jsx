import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MonitorPlay, LogOut, User as UserIcon } from 'lucide-react';

const MainLayout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col relative z-0">
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-primary-500/10 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-neon-purple/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <MonitorPlay className="w-6 h-6 text-primary-500 group-hover:text-neon-blue transition-colors" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-neon-blue group-hover:to-neon-purple transition-all duration-300">
          MockMind AI
          </span>
        </Link>
        
        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300 mr-2">{user?.name}</span>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm rounded flex items-center gap-2">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
