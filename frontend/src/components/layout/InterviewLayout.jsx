import React from "react";
import { Bell, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Outlet } from "react-router-dom";

const InterviewLayout = () => {
  const { user } = useAuth();

  // Always use the registered user's name
  const displayName =
    user?.name ||
    user?.username ||
    "User";

  const initial =
    displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#050816] text-white flex flex-col">

      {/* =====================================================
          TOP HEADER
          No sidebar here
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

        {/* Welcome */}
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white">
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
              <span>{displayName}</span>

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