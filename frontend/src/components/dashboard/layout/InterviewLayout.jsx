import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, LogOut, Bot, Bell, Brain } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const InterviewLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRound1 = location.pathname === "/round1";

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Always use the registered user's name
  const displayName =
    user?.name ||
    user?.username ||
    "User";

  const initial =
    displayName.charAt(0).toUpperCase();

  // =====================================================
  // CLOSE USER MENU WHEN CLICKING OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =====================================================
  // PROFILE
  // =====================================================

  const handleProfile = () => {
    setIsUserMenuOpen(false);

    // Use the existing profile route if it exists.
    navigate("/profile");
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setIsUserMenuOpen(false);

    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col relative overflow-x-hidden ${
        isRound1
          ? "text-[#f5f1ec] selection:bg-[#f3a078]/30 selection:text-white"
          : "bg-[#050816] text-white"
      }`}
      style={
        isRound1
          ? {
              backgroundColor: '#050606',
              backgroundImage: `
                radial-gradient(1300px 950px at 96% 2%, rgba(229, 138, 85, 0.22) 0%, rgba(210, 115, 65, 0.13) 24%, rgba(175, 90, 48, 0.06) 48%, rgba(110, 50, 25, 0.015) 70%, transparent 85%),
                radial-gradient(900px 500px at 100% 0%, rgba(240, 160, 120, 0.15) 0%, rgba(217, 120, 67, 0.06) 45%, transparent 75%)
              `,
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            }
          : undefined
      }
    >
      {/* =====================================================
          ROUND 1 — UPPER-RIGHT CINEMATIC AMBIENT LIGHT
      ====================================================== */}
      {isRound1 && (
        <>
          {/* Primary Warm Upper-Right Cinematic Light */}
          <div 
            className="fixed -top-[120px] -right-[120px] w-[1150px] h-[900px] pointer-events-none z-0"
            style={{
              background: 'radial-gradient(ellipse at 88% 12%, rgba(229, 138, 85, 0.24) 0%, rgba(210, 115, 65, 0.15) 25%, rgba(180, 95, 52, 0.07) 50%, rgba(111, 59, 37, 0.02) 70%, transparent 85%)',
              filter: 'blur(75px)',
            }}
          />
          {/* Secondary atmospheric top wash */}
          <div
            className="fixed top-0 right-0 w-[800px] h-[500px] pointer-events-none z-0"
            style={{
              background: 'radial-gradient(ellipse at 95% 0%, rgba(240, 154, 104, 0.16) 0%, rgba(229, 138, 85, 0.07) 40%, transparent 75%)',
              filter: 'blur(45px)',
            }}
          />
          {/* Faint ambient warmth along the right edge */}
          <div
            className="fixed top-[80px] right-0 w-[550px] h-[750px] pointer-events-none z-0"
            style={{
              background: 'radial-gradient(ellipse at 100% 25%, rgba(229, 138, 85, 0.11) 0%, rgba(180, 90, 45, 0.04) 45%, transparent 75%)',
              filter: 'blur(55px)',
            }}
          />

          {/* =====================================================
              ROUND 1 — SUBTLE DECORATIVE CURVED ORBITAL LINES
          ====================================================== */}
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
          >
            {/* Large curved arc from lower-left */}
            <path
              d="M-100,900 C180,820 400,560 520,240 C560,110 650,20 800,-40"
              fill="none"
              stroke="rgba(229, 138, 85, 0.07)"
              strokeWidth="1.2"
            />
            {/* Subtle curved line toward right side */}
            <path
              d="M750,950 C980,820 1180,560 1280,200 C1320,60 1380,-10 1460,-40"
              fill="none"
              stroke="rgba(229, 138, 85, 0.06)"
              strokeWidth="1"
            />
            {/* Lower-right faint curve */}
            <path
              d="M1020,950 C1200,850 1360,650 1440,420"
              fill="none"
              stroke="rgba(229, 138, 85, 0.05)"
              strokeWidth="1"
            />
          </svg>
        </>
      )}

      {/* =====================================================
          TOP HEADER
          No sidebar — Full width
      ===================================================== */}

      <header
        className={`
          h-[104px]
          min-h-[104px]
          px-10
          flex
          items-center
          justify-between
          border-b
          relative
          z-20
          ${
            isRound1
              ? "bg-[#070808]/40 border-b border-white/[0.06] text-[#f5f1ec]"
              : "border-white/10 bg-[#070b1d] text-white"
          }
        `}
      >

        {/* =================================================
            LEFT — BRANDING + WELCOME
        ================================================= */}

        {isRound1 ? (
          <div className="flex items-center gap-6">
            {/* MockMind AI Branding */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f3a078] to-[#e88c68] flex items-center justify-center shadow-md shadow-[#f3a078]/25">
                <Brain className="w-4.5 h-4.5 text-[#0d0f11]" />
              </div>

              <span className="font-bold text-lg tracking-tight">
                <span className="text-[#f5f1ec]">MockMind </span>
                <span className="text-[#f3a078]">AI</span>
              </span>
            </div>

            <div className="hidden sm:block h-6 w-[1px] bg-white/[0.08]" />

            <div className="hidden sm:block">
              <h2 className="text-sm font-semibold tracking-tight text-[#f5f1ec]">
                Welcome, {displayName}! 👋
              </h2>

              <p className="text-xs text-[#9e9e9e] mt-0.5">
                Ready to ace your next interview?
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-white">
              Welcome, {displayName}! 👋
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Ready to ace your next interview?
            </p>
          </div>
        )}

        {/* =================================================
            RIGHT — USER ONLY + ATMOSPHERIC LIGHT
        ================================================= */}

        <div
          className="relative flex items-center gap-4"
          ref={userMenuRef}
        >
          {/* Subtle warm atmospheric light behind right-side header controls */}
          {isRound1 && (
            <div 
              className="absolute -top-12 -right-12 w-[420px] h-[140px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 85% 45%, rgba(240, 160, 120, 0.20) 0%, rgba(229, 138, 85, 0.10) 45%, transparent 80%)',
                filter: 'blur(25px)',
              }}
            />
          )}

          {/* Notification Icon */}
          {isRound1 && (
            <div className="relative">
              <button
                type="button"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#a0a0a0] hover:text-[#f5f1ec] hover:bg-white/5 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#f3a078] shadow-[0_0_6px_rgba(243,160,120,0.6)]" />
              </button>
            </div>
          )}

          {/* =================================================
              USER BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              setIsUserMenuOpen(
                (previous) => !previous
              )
            }
            className="
              flex
              items-center
              gap-3
              rounded-xl
              px-3
              py-2
              text-white
              hover:bg-white/5
              transition-all
              duration-200
              cursor-pointer
            "
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >

            {/* Avatar */}

            <div
              className={`
                w-11
                h-11
                rounded-full
                p-[2px]
                ${
                  isRound1
                    ? "bg-gradient-to-br from-[#f3a078] to-[#e88c68]"
                    : "bg-gradient-to-br from-blue-400 to-cyan-400"
                }
              `}
            >
              <div
                className={`
                  w-full
                  h-full
                  rounded-full
                  flex
                  items-center
                  justify-center
                  border
                  ${
                    isRound1
                      ? "bg-[#080909] border-[#f3a078]/25"
                      : "bg-[#070b1d] border-blue-400/20"
                  }
                `}
              >
                <span
                  className={`
                    font-bold
                    text-base
                    ${
                      isRound1
                        ? "text-[#f3a078]"
                        : "text-blue-400"
                    }
                  `}
                >
                  {initial}
                </span>
              </div>
            </div>

            {/* Registered name */}

            <div
              className={`
                flex
                items-center
                gap-1.5
                font-medium
                ${
                  isRound1
                    ? "text-[#f5f1ec]"
                    : "text-white"
                }
              `}
            >
              <span>
                {displayName}
              </span>

              <ChevronDown
                className={`
                  w-4
                  h-4
                  transition-transform
                  duration-200
                  ${
                    isRound1
                      ? "text-[#9e9e9e]"
                      : "text-slate-400"
                  }
                  ${
                    isUserMenuOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </div>

          </button>

          {/* =================================================
              USER DROPDOWN
          ================================================= */}

          {isUserMenuOpen && (
            <div
              className={`
                absolute
                right-0
                top-full
                mt-3
                w-56
                rounded-xl
                border
                shadow-2xl
                shadow-black/50
                overflow-hidden
                z-[100]
                ${
                  isRound1
                    ? "bg-[#101112] border-white/10 text-[#f5f1ec]"
                    : "bg-[#0b1024] border-white/10 text-white"
                }
              `}
              role="menu"
            >

              {/* User information */}

              <div
                className="
                  px-4
                  py-3
                  border-b
                  border-white/10
                "
              >
                <p className="text-sm font-semibold text-[#f5f1ec] truncate">
                  {displayName}
                </p>

                <p className="text-xs text-[#9e9e9e] truncate mt-1">
                  {user?.email || ""}
                </p>
              </div>

              {/* Profile */}

              <button
                type="button"
                onClick={handleProfile}
                className="
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  text-sm
                  text-slate-200
                  hover:bg-white/5
                  hover:text-white
                  transition-colors
                  text-left
                "
                role="menuitem"
              >
                <User className="w-4 h-4 text-slate-400" />

                <span>
                  Profile
                </span>
              </button>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  text-sm
                  text-red-400
                  hover:bg-red-500/10
                  transition-colors
                  text-left
                  border-t
                  border-white/10
                "
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />

                <span>
                  Logout
                </span>
              </button>

            </div>
          )}

        </div>

      </header>

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      <main
        className={`
          flex-1
          overflow-y-auto
          relative
          z-10
          ${
            isRound1
              ? "bg-transparent flex flex-col"
              : "bg-[#050816]"
          }
        `}
      >
        <div
          className={`
            w-full
            mx-auto
            ${
              isRound1
                ? "max-w-[1400px] px-6 sm:px-10 py-8 flex-1 flex flex-col justify-between"
                : "max-w-[1600px] px-8 py-8"
            }
          `}
        >
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default InterviewLayout;