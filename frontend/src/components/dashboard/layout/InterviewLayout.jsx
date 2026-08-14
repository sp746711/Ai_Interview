import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { Outlet, useNavigate } from "react-router-dom";

const InterviewLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen w-full bg-[#050816] text-white flex flex-col">

      {/* =====================================================
          TOP HEADER
          No sidebar
          NO NOTIFICATION — TASK 11
      ===================================================== */}

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

        {/* =================================================
            LEFT — WELCOME
        ================================================= */}

        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white">
            Welcome, {displayName}! 👋
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Ready to ace your next interview?
          </p>
        </div>

        {/* =================================================
            RIGHT — USER ONLY
        ================================================= */}

        <div
          className="relative"
          ref={userMenuRef}
        >

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

            {/* Registered name */}

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
                className={`
                  w-4
                  h-4
                  text-slate-400
                  transition-transform
                  duration-200
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
              className="
                absolute
                right-0
                top-full
                mt-3
                w-56
                rounded-xl
                border
                border-white/10
                bg-[#0b1024]
                shadow-2xl
                shadow-black/40
                overflow-hidden
                z-[100]
              "
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
                <p className="text-sm font-semibold text-white truncate">
                  {displayName}
                </p>

                <p className="text-xs text-slate-400 truncate mt-1">
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
  );
};

export default InterviewLayout;