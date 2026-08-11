import React from 'react';
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import {
  LayoutDashboard,
  Play,
  History,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Bot,
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Always use the registered user's name.
  const displayName =
    user?.name ||
    user?.username ||
    'User';

  const initial =
    displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Start Interview',
      path: '/round1',
      icon: Play,
    },
    {
      label: 'History',
      path: '/history',
      icon: History,
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  /*
   * IMPORTANT:
   * The Final AI Interview page already has its own UI/header.
   *
   * Therefore, do NOT show:
   * - Dashboard sidebar
   * - Dashboard Welcome header
   *
   * for /ai-interview.
   *
   * Everything else using MainLayout remains unchanged.
   */
  if (location.pathname === '/ai-interview') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen w-full bg-[#050816] text-white flex overflow-hidden">

      {/* =========================================================
          SIDEBAR
      ========================================================= */}

      <aside
        className="
          w-[270px]
          min-w-[270px]
          min-h-screen
          bg-gradient-to-b
          from-[#0b1535]
          via-[#101c43]
          to-[#111f4b]
          border-r
          border-white/10
          flex
          flex-col
        "
      >

        {/* Logo */}

        <div className="px-7 pt-7 pb-8">

          <div className="flex items-center gap-3">

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gradient-to-br
                from-blue-500
                via-purple-500
                to-cyan-400
                flex
                items-center
                justify-center
                shadow-lg
                shadow-blue-500/20
              "
            >
              <Bot className="w-7 h-7 text-white" />
            </div>

            <div>

              <h1 className="text-[23px] font-bold tracking-tight">
                MockMind <span className="text-blue-400">AI</span>
              </h1>

              <p className="text-xs text-blue-200/60 mt-0.5">
                AI Interview Platform
              </p>

            </div>

          </div>

        </div>


        {/* Navigation */}

        <nav className="px-5 space-y-2 flex-1">

          {navItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `
                  group
                  flex
                  items-center
                  gap-4
                  px-5
                  py-4
                  rounded-2xl
                  font-medium
                  text-[16px]
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white shadow-[0_0_25px_rgba(59,130,246,0.12)] border border-blue-400/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }
                  `
                }
              >
                <Icon className="w-5 h-5 shrink-0" />

                <span>
                  {item.label}
                </span>

              </NavLink>
            );
          })}

        </nav>


        {/* Logout */}

        <div className="px-5 pb-7 pt-5 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-4
              px-5
              py-4
              rounded-2xl
              text-slate-300
              hover:text-white
              hover:bg-white/5
              transition-all
              duration-200
            "
          >

            <LogOut className="w-5 h-5" />

            <span className="font-medium text-[16px]">
              Logout
            </span>

          </button>

        </div>

      </aside>


      {/* =========================================================
          MAIN AREA
      ========================================================= */}

      <div
        className="
          flex-1
          min-w-0
          min-h-screen
          bg-[#050816]
          flex
          flex-col
        "
      >

        {/* =======================================================
            HEADER
        ======================================================= */}

        <header
          className="
            h-[104px]
            min-h-[104px]
            px-10
            flex
            items-center
            justify-between
            border-b
            border-white/10
            bg-[#070b1d]
          "
        >

          {/* Welcome */}

          <div>

            <h2
              className="
                text-[28px]
                font-bold
                tracking-tight
                text-white
              "
            >
              Welcome, {displayName}! 👋
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Ready to ace your next interview?
            </p>

          </div>


          {/* Right side */}

          <div className="flex items-center gap-7">

            {/* Notification */}

            <button
              type="button"
              className="
                relative
                p-2
                text-slate-300
                hover:text-blue-400
                transition-colors
              "
            >

              <Bell className="w-6 h-6" />

              <span
                className="
                  absolute
                  top-1
                  right-1
                  w-2.5
                  h-2.5
                  rounded-full
                  bg-red-500
                  border-2
                  border-[#070b1d]
                "
              />

            </button>


            {/* User */}

            <div className="flex items-center gap-3">

              {/* Avatar */}

              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  p-[2px]
                  bg-gradient-to-br
                  from-blue-400
                  to-cyan-400
                "
              >

                <div
                  className="
                    w-full
                    h-full
                    rounded-full
                    bg-[#070b1d]
                    flex
                    items-center
                    justify-center
                    border
                    border-blue-400/20
                  "
                >

                  <span
                    className="
                      text-blue-400
                      font-bold
                      text-base
                    "
                  >
                    {initial}
                  </span>

                </div>

              </div>


              {/* Name */}

              <div
                className="
                  flex
                  items-center
                  gap-1.5
                  text-white
                  font-medium
                "
              >

                <span>
                  {displayName}
                </span>

                <ChevronDown
                  className="
                    w-4
                    h-4
                    text-slate-400
                  "
                />

              </div>

            </div>

          </div>

        </header>


        {/* =======================================================
            PAGE CONTENT
        ======================================================= */}

        <main
          className="
            flex-1
            overflow-y-auto
            bg-[#050816]
          "
        >

          <div
            className="
              w-full
              max-w-[1600px]
              mx-auto
              px-8
              py-8
            "
          >

            <Outlet />

          </div>

        </main>

      </div>

    </div>
  );
};

export default MainLayout;