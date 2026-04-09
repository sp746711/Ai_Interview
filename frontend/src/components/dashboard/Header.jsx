import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Bell } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();
  // Using explicit name Sujan as per prompt if user name missing
  const displayName = user?.name || 'Sujan';

  return (
    <header className="bg-white sticky top-0 z-10 px-8 py-5 flex justify-between items-center border-b border-gray-100 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          Welcome, {displayName}! 👋
        </h2>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-blue-600 font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
            {displayName}
            <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
