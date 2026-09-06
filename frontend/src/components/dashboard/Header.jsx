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
  AlertCircle,
  Trash2,
} from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

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
  // USER-SPECIFIC STORAGE KEYS
  // ======================================================

  const notificationStorageKey =
    `mockmind_notifications_${displayEmail || displayName}`;

  const dismissedStorageKey =
    `mockmind_dismissed_notifications_${displayEmail || displayName}`;

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
  // FORMAT NOTIFICATION TIME
  // ======================================================

  const formatNotificationTime = (dateValue) => {
    if (!dateValue) {
      return "Just now";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    const now = new Date();

    const difference =
      Math.max(
        0,
        now.getTime() - date.getTime()
      );

    const seconds =
      Math.floor(
        difference / 1000
      );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (minutes < 60) {
      return `${minutes} minute${
        minutes !== 1 ? "s" : ""
      } ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours} hour${
        hours !== 1 ? "s" : ""
      } ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    if (days < 7) {
      return `${days} day${
        days !== 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString();
  };

  // ======================================================
  // LOAD SAVED NOTIFICATIONS
  // ======================================================

  const loadSavedNotifications = () => {
    try {
      const saved =
        localStorage.getItem(
          notificationStorageKey
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      return [];
    }
  };

  // ======================================================
  // SAVE NOTIFICATIONS
  // ======================================================

  const saveNotifications = (items) => {
    try {
      localStorage.setItem(
        notificationStorageKey,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Failed to save notifications:",
        error
      );
    }
  };

  // ======================================================
  // LOAD DISMISSED NOTIFICATION IDS
  // ======================================================

  const loadDismissedNotifications = () => {
    try {
      const saved =
        localStorage.getItem(
          dismissedStorageKey
        );

      if (!saved) {
        return [];
      }

      const parsed =
        JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "Failed to load dismissed notifications:",
        error
      );

      return [];
    }
  };

  // ======================================================
  // SAVE DISMISSED NOTIFICATION IDS
  // ======================================================

  const saveDismissedNotifications = (
    ids
  ) => {
    try {
      localStorage.setItem(
        dismissedStorageKey,
        JSON.stringify(ids)
      );
    } catch (error) {
      console.error(
        "Failed to save dismissed notifications:",
        error
      );
    }
  };

  // ======================================================
  // CREATE DYNAMIC NOTIFICATIONS
  // ======================================================

  const buildInterviewNotifications = (
    history,
    existingNotifications,
    dismissedIds
  ) => {
    if (!Array.isArray(history)) {
      return existingNotifications;
    }

    const existingById =
      new Map(
        existingNotifications.map(
          (notification) => [
            notification.id,
            notification,
          ]
        )
      );

    const generated = [];

    // ====================================================
    // SORT HISTORY
    // ====================================================

    const sortedHistory =
      [...history].sort(
        (a, b) => {
          const dateA =
            new Date(
              a?.date || 0
            ).getTime();

          const dateB =
            new Date(
              b?.date || 0
            ).getTime();

          return dateA - dateB;
        }
      );

    // ====================================================
    // TRACK PERSONAL BEST
    // ====================================================

    let previousBest = 0;

    for (
      const interview
      of sortedHistory
    ) {
      if (!interview?.id) {
        continue;
      }

      const interviewId =
        String(interview.id);

      const stage =
        String(
          interview.stage || ""
        ).toLowerCase();

      const role =
        interview.role ||
        interview.interview_type ||
        "Interview";

      // ==================================================
      // COMPLETED INTERVIEW
      // ==================================================

      if (
        stage === "feedback"
      ) {
        const completedId =
          `completed-${interviewId}`;

        const finalScore =
          Number(
            interview.final_score || 0
          );

        const oldCompleted =
          existingById.get(
            completedId
          );

        /*
         * IMPORTANT:
         *
         * Notification time is NOT the interview date.
         *
         * If this notification is new,
         * createdAt = NOW.
         */

        if (
          !dismissedIds.includes(
            completedId
          )
        ) {
          generated.push(
            oldCompleted || {
              id: completedId,
              type: "success",
              title:
                "Interview Completed",
              message:
                `Your ${role} interview is completed. ` +
                `Your final score is ${finalScore}/100.`,
              time:
                "Just now",
              unread: true,
              createdAt:
                new Date().toISOString(),
            }
          );
        }

        // =================================================
        // PERSONAL BEST
        // =================================================

        if (
          finalScore > previousBest
        ) {
          const personalBestId =
            `personal-best-${interviewId}`;

          const oldPersonalBest =
            existingById.get(
              personalBestId
            );

          if (
            !dismissedIds.includes(
              personalBestId
            )
          ) {
            generated.push(
              oldPersonalBest || {
                id: personalBestId,
                type: "score",
                title:
                  "New Personal Best",
                message:
                  `Congratulations! You achieved ` +
                  `your highest interview score: ` +
                  `${finalScore}/100.`,
                time:
                  "Just now",
                unread: true,
                createdAt:
                  new Date().toISOString(),
              }
            );
          }

          previousBest =
            finalScore;
        }

        continue;
      }

      // ==================================================
      // INCOMPLETE INTERVIEW
      // ==================================================

      const incompleteStages = [
        "round1",
        "test",
        "setup",
        "ai",
      ];

      if (
        incompleteStages.includes(
          stage
        )
      ) {
        const incompleteId =
          `incomplete-${interviewId}`;

        const oldIncomplete =
          existingById.get(
            incompleteId
          );

        let stageMessage =
          "You left this interview before completing it.";

        if (
          stage === "round1"
        ) {
          stageMessage =
            `You started your ${role} interview ` +
            `but did not complete Round 1.`;
        }

        if (
          stage === "test"
        ) {
          stageMessage =
            `You left your ${role} interview ` +
            `before completing the online test.`;
        }

        if (
          stage === "setup"
        ) {
          stageMessage =
            `You left your ${role} interview ` +
            `during the interview setup.`;
        }

        if (
          stage === "ai"
        ) {
          stageMessage =
            `You left your ${role} interview ` +
            `before completing the AI interview.`;
        }

        /*
         * IMPORTANT:
         *
         * If notification already exists,
         * keep its original createdAt.
         *
         * If it is NEW,
         * use the current time.
         */

        if (
          !dismissedIds.includes(
            incompleteId
          )
        ) {
          generated.push(
            oldIncomplete || {
              id: incompleteId,
              type: "warning",
              title:
                "Interview Incomplete",
              message:
                stageMessage,
              time:
                "Just now",
              unread: true,
              createdAt:
                new Date().toISOString(),
            }
          );
        }
      }
    }

    // ====================================================
    // KEEP OLD NOTIFICATIONS
    // ====================================================

    const generatedIds =
      new Set(
        generated.map(
          (notification) =>
            notification.id
        )
      );

    const oldNotifications =
      existingNotifications.filter(
        (notification) =>
          !generatedIds.has(
            notification.id
          ) &&
          !dismissedIds.includes(
            notification.id
          )
      );

    // ====================================================
    // MERGE
    // ====================================================

    return [
      ...generated,
      ...oldNotifications,
    ]
      .filter(
        (notification) =>
          !dismissedIds.includes(
            notification.id
          )
      )
      .sort(
        (a, b) => {
          const dateA =
            new Date(
              a.createdAt || 0
            ).getTime();

          const dateB =
            new Date(
              b.createdAt || 0
            ).getTime();

          return dateB - dateA;
        }
      );
  };

  // ======================================================
  // FETCH REAL INTERVIEW HISTORY
  // ======================================================

  const loadDynamicNotifications =
    async () => {
      setNotificationsLoading(
        true
      );

      try {
        const savedNotifications =
          loadSavedNotifications();

        const dismissedIds =
          loadDismissedNotifications();

        const response =
          await fetch(
            "http://127.0.0.1:8001/api/interview/history",
            {
              method: "GET",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            `Notification history request failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        const history =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.history
              )
              ? data.history
              : [];

        const dynamicNotifications =
          buildInterviewNotifications(
            history,
            savedNotifications,
            dismissedIds
          );

        setNotifications(
          dynamicNotifications
        );

        saveNotifications(
          dynamicNotifications
        );
      } catch (error) {
        console.error(
          "Failed to load dynamic notifications:",
          error
        );

        const savedNotifications =
          loadSavedNotifications();

        const dismissedIds =
          loadDismissedNotifications();

        const visibleNotifications =
          savedNotifications.filter(
            (notification) =>
              !dismissedIds.includes(
                notification.id
              )
          );

        setNotifications(
          visibleNotifications
        );
      } finally {
        setNotificationsLoading(
          false
        );
      }
    };

  // ======================================================
  // LOAD + REFRESH
  // ======================================================

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationsLoading(
        false
      );

      return;
    }

    loadDynamicNotifications();

    const interval =
      setInterval(() => {
        loadDynamicNotifications();
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [
    user?.email,
    user?.name,
  ]);

  // ======================================================
  // UNREAD COUNT
  // ======================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.unread
    ).length;

  // ======================================================
  // NOTIFICATION BUTTON
  // ======================================================

  const handleNotificationClick =
    () => {
      setNotificationOpen(
        (previous) => !previous
      );

      setUserMenuOpen(false);
    };

  // ======================================================
  // MARK ONE AS READ
  // ======================================================

  const markNotificationAsRead =
    (notificationId) => {
      setNotifications(
        (previous) => {
          const updated =
            previous.map(
              (notification) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,
                      unread: false,
                    }
                  : notification
            );

          saveNotifications(
            updated
          );

          return updated;
        }
      );
    };

  // ======================================================
  // MARK ALL AS READ
  // ======================================================

  const markAllAsRead = () => {
    setNotifications(
      (previous) => {
        const updated =
          previous.map(
            (notification) => ({
              ...notification,
              unread: false,
            })
          );

        saveNotifications(
          updated
        );

        return updated;
      }
    );
  };

  // ======================================================
  // CLEAR ALL
  // ======================================================

  const clearAllNotifications =
    () => {
      /*
       * IMPORTANT:
       *
       * Save every currently visible
       * notification ID as dismissed.
       *
       * Therefore the next 10-second
       * refresh will NOT recreate them.
       */

      const currentIds =
        notifications.map(
          (notification) =>
            notification.id
        );

      const previousDismissed =
        loadDismissedNotifications();

      const mergedDismissed =
        Array.from(
          new Set([
            ...previousDismissed,
            ...currentIds,
          ])
        );

      saveDismissedNotifications(
        mergedDismissed
      );

      // Immediately show 0
      setNotifications([]);

      saveNotifications([]);

      setNotificationOpen(false);
    };

  // ======================================================
  // NOTIFICATION ICON
  // ======================================================

  const getNotificationIcon =
    (type) => {
      if (
        type === "success"
      ) {
        return (
          <CheckCircle2
            className="w-5 h-5 text-emerald-400"
          />
        );
      }

      if (
        type === "score"
      ) {
        return (
          <BarChart3
            className="w-5 h-5 text-yellow-400"
          />
        );
      }

      if (
        type === "warning"
      ) {
        return (
          <AlertCircle
            className="w-5 h-5 text-orange-400"
          />
        );
      }

      if (
        type === "security"
      ) {
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

  const handleUserMenuClick =
    () => {
      setUserMenuOpen(
        (previous) => !previous
      );

      setNotificationOpen(false);
    };

  const handleProfile =
    () => {
      setUserMenuOpen(false);

      navigate("/profile");
    };

  const handleHistory =
    () => {
      setUserMenuOpen(false);

      navigate("/history");
    };

  const handleLogout =
    () => {
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
        h-[104px]
        min-h-[104px]
        px-10
        flex
        items-center
        justify-between
        bg-[#08090a]/35
        backdrop-blur-md
        text-[#f5f1ec]
        border-b
        border-white/[0.05]
        relative
        z-20
      "
    >
      {/* Soft warm reflection touching the right of the header */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-full pointer-events-none"
        style={{
          background: 'linear-gradient(to left, rgba(201, 121, 80, 0.05), rgba(168, 94, 61, 0.015) 60%, transparent 100%)',
        }}
      />

      {/* ==================================================
          LEFT — WELCOME
      ================================================== */}

      <div>
        <h2
          className="
            text-[28px]
            font-bold
            tracking-tight
            text-[#f5f1ec]
          "
        >
          Welcome, {displayName}! 👋
        </h2>

        <p className="text-sm text-[#9a9a9a] mt-1 font-normal">
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
            onClick={
              handleNotificationClick
            }
            className="
              relative
              p-2
              text-slate-300
              hover:text-[#f4a07a]
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
                  bg-[#f3a078]
                  text-[#0d0f10]
                  text-[10px]
                  font-bold
                  flex
                  items-center
                  justify-center
                  border-2
                  border-[#0a0b0d]
                "
              >
                {unreadCount}
              </span>
            )}

          </button>

          {/* ==================================================
              NOTIFICATION DROPDOWN
          ================================================== */}

          {notificationOpen && (
            <div
              className="
                absolute
                right-0
                top-12
                w-[380px]
                bg-[#131416]
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
                    {notificationsLoading
                      ? "Checking your interview activity..."
                      : unreadCount > 0
                        ? `You have ${unreadCount} new notification${
                            unreadCount !== 1
                              ? "s"
                              : ""
                          }`
                        : "You're all caught up"}
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={
                        markAllAsRead
                      }
                      className="
                        text-xs
                        text-[#f4a07a]
                        hover:text-[#f39a73]
                        transition-colors
                      "
                    >
                      Mark all as read
                    </button>
                  )}

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={
                        clearAllNotifications
                      }
                      className="
                        text-xs
                        text-red-400
                        hover:text-red-300
                        transition-colors
                        flex
                        items-center
                        gap-1
                      "
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}

                </div>

              </div>

              {/* ==================================================
                  LIST
              ================================================== */}

              <div className="max-h-[360px] overflow-y-auto">

                {notificationsLoading ? (
                  <div className="px-5 py-10 text-center">

                    <Bell className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />

                    <p className="text-sm text-slate-400 mt-3">
                      Loading notifications...
                    </p>

                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">

                    <Bell className="w-8 h-8 mx-auto text-slate-600" />

                    <p className="text-sm text-slate-400 mt-3">
                      No notifications
                    </p>

                    <p className="text-xs text-slate-600 mt-1">
                      New interview activity will appear here.
                    </p>

                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <button
                        key={
                          notification.id
                        }
                        type="button"
                        onClick={() =>
                          markNotificationAsRead(
                            notification.id
                          )
                        }
                        className={`
                          w-full
                          text-left
                          px-5
                          py-4
                          border-b
                          border-white/5
                          hover:bg-white/5
                          transition-colors
                          ${
                            notification.unread
                              ? "bg-[#f4a07a]/[0.06]"
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
                                {
                                  notification.title
                                }
                              </h4>

                              {notification.unread && (
                                <span className="w-2 h-2 rounded-full bg-[#f4a07a] mt-1.5 shrink-0" />
                              )}

                            </div>

                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {
                                notification.message
                              }
                            </p>

                            <span className="text-[11px] text-slate-500 mt-2 block">
                              {
                                notification.time
                              }
                            </span>

                          </div>

                        </div>

                      </button>
                    )
                  )
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
            onClick={
              handleUserMenuClick
            }
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

            <div
              className="
                w-11
                h-11
                rounded-full
                p-[2px]
                bg-gradient-to-br
                from-[#f3a078]
                to-[#e88c68]
              "
            >
              <div
                className="
                  w-full
                  h-full
                  rounded-full
                  bg-[#111315]
                  flex
                  items-center
                  justify-center
                  border
                  border-[#f3a078]/30
                "
              >
                <span
                  className="
                    text-[#f3a078]
                    font-bold
                    text-base
                  "
                >
                  {initial}
                </span>
              </div>
            </div>

            <div
              className="
                flex
                items-center
                gap-1.5
                text-[#f7f5f0]
                font-medium
                group-hover:text-[#f4a07a]
                transition-colors
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
                    userMenuOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />

            </div>

          </button>

          {/* ==================================================
              USER DROPDOWN
          ================================================== */}

          {userMenuOpen && (
            <div
              className="
                absolute
                right-0
                top-14
                w-[280px]
                bg-[#131416]
                border
                border-white/10
                rounded-2xl
                shadow-2xl
                overflow-hidden
                z-[100]
              "
            >

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
                      from-[#f3a078]
                      to-[#e88c68]
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    <span className="text-[#0d0f10] font-bold">
                      {initial}
                    </span>
                  </div>

                  <div className="min-w-0">

                    <p className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </p>

                    <p className="text-xs text-slate-400 truncate mt-1">
                      {displayEmail ||
                        "Email not available"}
                    </p>

                  </div>

                </div>

              </div>

              <div className="p-2">

                <button
                  type="button"
                  onClick={
                    handleProfile
                  }
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
                    hover:text-[#f4a07a]
                    hover:bg-white/[0.04]
                    transition-colors
                  "
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={
                    handleHistory
                  }
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
                    hover:text-[#f4a07a]
                    hover:bg-white/[0.04]
                    transition-colors
                  "
                >
                  <History className="w-5 h-5" />
                  <span>Interview History</span>
                </button>

              </div>

              <div className="border-t border-white/10 p-2">

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
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