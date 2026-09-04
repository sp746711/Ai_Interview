import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bot, Menu, X } from 'lucide-react';
import './landing.css';

const navItems = [
  { label: 'Features', path: '/features' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Why MockMind AI?', path: '/why-mockmind' },
];

const LandingLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="landing-page text-white flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between">
          <Link
            to="/"
            onClick={closeMobile}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-landing-peach/90 to-landing-bronze flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#0a0a0a]" />
            </div>
            <div>
              <span className="font-semibold text-[15px] sm:text-base tracking-tight text-white">
                MockMind AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `text-sm font-medium landing-nav-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              to="/login"
              className="text-sm font-medium px-5 py-2.5 rounded-lg border border-white/10 text-white/90 hover:border-landing-peach/40 hover:text-landing-peach transition-colors"
            >
              Login
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#0d0d0d] px-5 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `block py-3 text-sm font-medium landing-nav-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              onClick={closeMobile}
              className="block mt-3 py-3 text-sm font-medium text-landing-peach"
            >
              Login
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/[0.06] py-8 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-landing-muted">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-landing-peach/70" />
            <span className="text-white/80 font-medium">MockMind AI</span>
          </div>
          <p className="text-center sm:text-right">
            Practice Today. Perform Tomorrow.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;
