import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Bell,
  User,
  History,
  LogOut,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState([
      {
        id: 1,
        type: "success",
        title: "Interview Completed",
        message: "Your interview report is ready.",
        time: "Recently",
        unread: true,
      },
      {
        id: 2,
        type: "score",
        title: "Personal Best",
        message: "You achieved your highest interview score.",
        time: "Recently",
        unread: true,
      },
      {
        id: 3,
        type: "tip",
        title: "Interview Tip",
        message: "Focus on your weaker areas to improve your next score.",
        time: "Recently",
        unread: true,
      },
    ]);

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // ======================================================
  // USER INFORMATION
  // ======================================================

  const displayName =
    user?.name ||
    user?.username ||
    "User";

  const displayEmail =
    user?.email ||
    "";

  const initial =
    displayName.charAt(0).toUpperCase();

  // ======================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // ======================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ======================================================
  // NOTIFICATION
  // ======================================================

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const handleNotificationClick = () => {
    setNotificationOpen((previous) => !previous);
    setUserMenuOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const getNotificationIcon = (type) => {
    if (type === "success") {
      return (
        <CheckCircle2
          className="w-5 h-5 text-emerald-400"
        />
      );
    }

    if (type === "score") {
      return (
        <BarChart3
          className="w-5 h-5 text-yellow-400"
        />
      );
    }

    if (type === "security") {
      return (
        <ShieldCheck
          className="w-5 h-5 text-blue-400"
        />
      );
    }

    return (
      <Lightbulb
        className="w-5 h-5 text-cyan-400"
      />
    );
  };

  // ======================================================
  // USER MENU
  // ======================================================

  const handleUserMenuClick = () => {
    setUserMenuOpen((previous) => !previous);
    setNotificationOpen(false);
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    navigate("/profile");
  };

  const handleHistory = () => {
    setUserMenuOpen(false);
    navigate("/history");
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate("/login");
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <header
      className="
        sticky
        top-0
        z-50
        h-[104px]
        min-h-[104px]
        px-10
        flex
        items-center
        justify-between
        bg-[#070b1d]
        text-white
        border-b
        border-white/10
      "
    >

      {/* ==================================================
          LEFT — WELCOME
      ================================================== */}

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

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="flex items-center gap-7">

        {/* ==================================================
            NOTIFICATION
        ================================================== */}

        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={handleNotificationClick}
            className="
              relative
              p-2
              text-slate-300
              hover:text-blue-400
              transition-colors
            "
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />

            {unreadCount > 0 && (
              <span
                className="
                  absolute
                  top-0.5
                  right-0
                  min-w-[18px]
                  h-[18px]
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-[10px]
                  font-bold
                  flex
                  items-center
                  justify-center
                  border-2
                  border-[#070b1d]
                "
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}

          {notificationOpen && (
            <div
              className="
                absolute
                right-0
                top-12
                w-[380px]
                bg-[#0b1128]
                border
                border-white/10
                rounded-2xl
                shadow-2xl
                overflow-hidden
                z-[100]
              "
            >

              {/* Header */}

              <div
                className="
                  px-5
                  py-4
                  border-b
                  border-white/10
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <h3 className="font-semibold text-white">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {unreadCount > 0
                      ? `You have ${unreadCount} new notification${
                          unreadCount !== 1 ? "s" : ""
                        }`
                      : "You're all caught up"}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="
                      text-xs
                      text-blue-400
                      hover:text-blue-300
                      transition-colors
                    "
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}

              <div className="max-h-[360px] overflow-y-auto">

                {notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Bell className="w-8 h-8 mx-auto text-slate-600" />

                    <p className="text-sm text-slate-400 mt-3">
                      No notifications
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        px-5
                        py-4
                        border-b
                        border-white/5
                        hover:bg-white/5
                        transition-colors
                        ${
                          notification.unread
                            ? "bg-blue-500/5"
                            : ""
                        }
                      `}
                    >
                      <div className="flex gap-3">

                        <div className="mt-0.5 shrink-0">
                          {getNotificationIcon(
                            notification.type
                          )}
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-start justify-between gap-3">

                            <h4 className="text-sm font-medium text-white">
                              {notification.title}
                            </h4>

                            {notification.unread && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            )}

                          </div>

                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>

                          <span className="text-[11px] text-slate-500 mt-2 block">
                            {notification.time}
                          </span>

                        </div>

                      </div>
                    </div>
                  ))
                )}

              </div>

            </div>
          )}
        </div>

        {/* ==================================================
            USER MENU
        ================================================== */}

        <div
          ref={userMenuRef}
          className="relative"
        >

          <button
            type="button"
            onClick={handleUserMenuClick}
            className="
              flex
              items-center
              gap-3
              cursor-pointer
              group
              bg-transparent
              border-0
              p-0
              text-left
            "
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

            {/* Name */}

            <div
              className="
                flex
                items-center
                gap-1.5
                text-white
                font-medium
                group-hover:text-blue-400
                transition-colors
              "
            >
              <span>{displayName}</span>

              <ChevronDown
                className={`
                  w-4
                  h-4
                  text-slate-400
                  transition-transform
                  duration-200
                  ${
                    userMenuOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </div>

          </button>

          {/* User Dropdown */}

          {userMenuOpen && (
            <div
              className="
                absolute
                right-0
                top-14
                w-[280px]
                bg-[#0b1128]
                border
                border-white/10
                rounded-2xl
                shadow-2xl
                overflow-hidden
                z-[100]
              "
            >

              {/* User Information */}

              <div
                className="
                  px-5
                  py-5
                  border-b
                  border-white/10
                "
              >

                <div className="flex items-center gap-3">

                  <div
                    className="
                      w-11
                      h-11
                      rounded-full
                      bg-gradient-to-br
                      from-blue-400
                      to-cyan-400
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <span className="text-slate-950 font-bold">
                      {initial}
                    </span>
                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </p>

                    <p className="text-xs text-slate-400 truncate mt-1">
                      {displayEmail || "Email not available"}
                    </p>

                  </div>

                </div>

              </div>

              {/* Menu */}

              <div className="p-2">

                <button
                  type="button"
                  onClick={handleProfile}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-xl
                    text-sm
                    text-slate-300
                    hover:text-white
                    hover:bg-white/5
                    transition-colors
                  "
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleHistory}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-xl
                    text-sm
                    text-slate-300
                    hover:text-white
                    hover:bg-white/5
                    transition-colors
                  "
                >
                  <History className="w-5 h-5" />
                  <span>Interview History</span>
                </button>

              </div>

              {/* Logout */}

              <div className="border-t border-white/10 p-2">

                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3
                    py-3
                    rounded-xl
                    text-sm
                    text-red-400
                    hover:text-red-300
                    hover:bg-red-500/10
                    transition-colors
                  "
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>

              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
};

export default Header;