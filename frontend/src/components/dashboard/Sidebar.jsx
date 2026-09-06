import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  LayoutDashboard,
  History,
  User,
} from 'lucide-react';

import {
  NavLink,
} from 'react-router-dom';

import AIAvatar from '../ai/AIAvatar';
import getAvatarMessage from '../ai/avatarLogic';

const AVATAR_EVENT_KEY =
  'mockmind_avatar_event';

const DASHBOARD_MESSAGE_KEY =
  'mockmind_last_dashboard_avatar_message';

const DASHBOARD_DATA_KEY =
  'mockmind_dashboard_avatar_data';

const LOGIN_SESSION_KEY =
  'mockmind_avatar_login_session';

const WELCOME_PENDING_KEY =
  'mockmind_avatar_welcome_pending';

const DASHBOARD_QUEUE_KEY =
  'mockmind_dashboard_avatar_queue';

const DASHBOARD_LAST_COMPLETED_KEY =
  'mockmind_dashboard_last_completed';

const DASHBOARD_QUEUE_INDEX_KEY =
  'mockmind_dashboard_queue_index';

// TASK 14 ONLY:
// One-time marker used only for Feedback -> Dashboard.
const FEEDBACK_DASHBOARD_PENDING_KEY =
  'mockmind_feedback_dashboard_pending';


// ============================================================
// SIDEBAR
// ============================================================

const Sidebar = () => {

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },

    {
      name: 'History',
      path: '/history',
      icon: History,
    },

    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];


  // ==========================================================
  // TASK 13 + TASK 14
  // Existing avatar visual remains unchanged.
  // ==========================================================

  const [
    avatarMessage,
    setAvatarMessage,
  ] = useState(null);

  const [
    isSpeaking,
    setIsSpeaking,
  ] = useState(false);

  // TASK 13 ONLY — Dashboard message scheduler state.
  const dashboardTimerRef =
    useRef(null);

  const dashboardMessagesRef =
    useRef([]);

  const dashboardIndexRef =
    useRef(0);


  // ==========================================================
  // GET CURRENT USER
  // ==========================================================

  const getCurrentUser = useCallback(() => {

    try {

      const storedUser =
        localStorage.getItem('user');

      if (storedUser) {

        return JSON.parse(
          storedUser
        );

      }

    } catch (error) {

      console.error(
        'Avatar user data error:',
        error
      );

    }

    return null;

  }, []);


  // ==========================================================
  // SPEAK ONE AVATAR MESSAGE
  // ==========================================================

  const speakAvatarMessage =
    useCallback((message) => {

      if (!message) {
        return;
      }

      setAvatarMessage(
        message
      );


      if (
        typeof window === 'undefined' ||
        !(
          'speechSynthesis'
          in window
        )
      ) {

        return;

      }


      // ------------------------------------------------------
      // Stop previous speech.
      // ------------------------------------------------------

      window.speechSynthesis.cancel();


      const speech =
        new SpeechSynthesisUtterance(
          message
        );


      speech.rate = 0.95;

      speech.pitch = 1;

      speech.volume = 1;


      speech.onstart = () => {

        setIsSpeaking(
          true
        );

      };


      speech.onend = () => {

        setIsSpeaking(
          false
        );

      };


      speech.onerror = () => {

        setIsSpeaking(
          false
        );

      };


      window.speechSynthesis.speak(
        speech
      );

    }, []);


  // ==========================================================
  // TASK 14
  // PROCESS IMPORTANT EVENT
  //
  // UNCHANGED
  // ==========================================================

  const handleAvatarEvent =
    useCallback(
      (avatarEvent) => {

        if (!avatarEvent) {
          return;
        }


        const currentUser =
          getCurrentUser();


        const message =
          getAvatarMessage({

            user:
              currentUser,


            // ------------------------------------------------
            // Dashboard state is intentionally disabled here.
            // This call is ONLY for Task 14 events.
            // ------------------------------------------------

            isNewUser:
              false,

            isReturningUser:
              false,

            hasIncompleteInterview:
              false,

            interviewCompleted:
              false,

            score:
              null,

            previousBest:
              null,

            totalInterviews:
              0,

            completedInterviews:
              0,

            interviewType:
              null,


            // ------------------------------------------------
            // IMPORTANT TASK 14 EVENT
            // ------------------------------------------------

            avatarEvent,

          });


        /*
         * Unknown events return null.
         * Do not speak anything for unknown events.
         */

        if (!message) {
          return;
        }


        speakAvatarMessage(
          message
        );

      },
      [
        getCurrentUser,
        speakAvatarMessage,
      ]
    );


  // ==========================================================
  // TASK 13
  // DASHBOARD MESSAGE + 30 SECOND ROTATION
  //
  // ONLY runs while the user is on /dashboard.
  // Existing avatarLogic.js remains unchanged.
  // ==========================================================

  const buildDashboardMessages =
    useCallback((dashboardData) => {
      if (!dashboardData) {
        return [];
      }

      const currentUser =
        getCurrentUser();

      const common = {
        user: currentUser,
        score:
          dashboardData.score ?? null,
        previousBest:
          dashboardData.previousBest ?? null,
        totalInterviews:
          Number(
            dashboardData.totalInterviews || 0
          ),
        completedInterviews:
          Number(
            dashboardData.completedInterviews || 0
          ),
        interviewType:
          dashboardData.interviewType ||
          null,
        technicalInterviews:
          Number(
            dashboardData.technicalInterviews || 0
          ),
        nonTechnicalInterviews:
          Number(
            dashboardData.nonTechnicalInterviews || 0
          ),
        previousScore:
          dashboardData.previousScore ?? null,
        avatarEvent: null,
      };

      const messages = [];

      const add = (params) => {
        const message =
          getAvatarMessage({
            ...common,
            isNewUser: false,
            isReturningUser: false,
            hasIncompleteInterview: false,
            interviewCompleted: false,
            ...params,
          });

        if (
          message &&
          !messages.includes(message)
        ) {
          messages.push(message);
        }
      };

      // 1. Latest interview incomplete.
      if (
        dashboardData.hasIncompleteInterview
      ) {
        add({
          hasIncompleteInterview: true,
        });
      }

      // 2. No interview.
      if (
        Number(
          dashboardData.totalInterviews || 0
        ) === 0 &&
        Number(
          dashboardData.completedInterviews || 0
        ) === 0
      ) {
        add({});
      }

      // 3. Personal best.
      if (
        dashboardData.interviewCompleted &&
        dashboardData.score !== null &&
        dashboardData.previousBest !== null &&
        Number(dashboardData.score) >
          Number(dashboardData.previousBest)
      ) {
        add({
          interviewCompleted: true,
          hasIncompleteInterview: false,
        });
      }

      // 4. Score improvement.
      if (
        dashboardData.interviewCompleted &&
        dashboardData.score !== null &&
        dashboardData.previousScore !== null &&
        Number(dashboardData.score) >
          Number(dashboardData.previousScore)
      ) {
        add({
          interviewCompleted: true,
          previousBest:
            Number(dashboardData.score),
        });
      }

      // 5. Score decrease.
      if (
        dashboardData.interviewCompleted &&
        dashboardData.score !== null &&
        dashboardData.previousScore !== null &&
        Number(dashboardData.score) <
          Number(dashboardData.previousScore)
      ) {
        add({
          interviewCompleted: true,
          previousBest:
            Number(dashboardData.score) + 1,
        });
      }

      // 6. Completed interview.
      if (
        dashboardData.interviewCompleted &&
        dashboardData.score !== null
      ) {
        add({
          interviewCompleted: true,
          previousBest:
            Number(dashboardData.score) + 1,
          previousScore: null,
          technicalInterviews: 0,
          nonTechnicalInterviews: 0,
        });
      }

      // 7. Combined progress.
      if (
        Number(
          dashboardData.technicalInterviews || 0
        ) > 0 &&
        Number(
          dashboardData.nonTechnicalInterviews || 0
        ) > 0
      ) {
        add({
          interviewCompleted: false,
          technicalInterviews:
            Number(
              dashboardData.technicalInterviews
            ),
          nonTechnicalInterviews:
            Number(
              dashboardData.nonTechnicalInterviews
            ),
        });
      }

      // 8. Technical progress.
      if (
        Number(
          dashboardData.technicalInterviews || 0
        ) > 0
      ) {
        add({
          interviewCompleted: false,
          technicalInterviews:
            Number(
              dashboardData.technicalInterviews
            ),
          nonTechnicalInterviews: 0,
        });
      }

      // 9. Non-technical progress.
      if (
        Number(
          dashboardData.nonTechnicalInterviews || 0
        ) > 0
      ) {
        add({
          interviewCompleted: false,
          technicalInterviews: 0,
          nonTechnicalInterviews:
            Number(
              dashboardData.nonTechnicalInterviews
            ),
        });
      }

      // 10. Score.
      if (
        dashboardData.score !== null
      ) {
        add({
          interviewCompleted: false,
          technicalInterviews: 0,
          nonTechnicalInterviews: 0,
        });
      }

      // 11. Progress / milestone.
      if (
        Number(
          dashboardData.completedInterviews || 0
        ) > 0
      ) {
        add({
          interviewCompleted: false,
          score: null,
          technicalInterviews: 0,
          nonTechnicalInterviews: 0,
        });
      }

      return messages;
    }, [getCurrentUser]);

  const stopDashboardScheduler =
    useCallback(() => {
      if (
        dashboardTimerRef.current
      ) {
        window.clearTimeout(
          dashboardTimerRef.current
        );

        dashboardTimerRef.current =
          null;
      }

      dashboardMessagesRef.current =
        [];

      dashboardIndexRef.current =
        0;

      if (
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        window.speechSynthesis.cancel();
      }

      setIsSpeaking(false);
    }, []);

  const speakDashboardMessage =
    useCallback((message) => {
      if (!message) {
        return;
      }

      if (
        typeof window !== 'undefined' &&
        window.location.pathname !==
          '/dashboard'
      ) {
        return;
      }

      setAvatarMessage(message);

      if (
        typeof window === 'undefined' ||
        !(
          'speechSynthesis' in window
        )
      ) {
        return;
      }

      window.speechSynthesis.cancel();

      const speech =
        new SpeechSynthesisUtterance(
          message
        );

      speech.rate = 0.95;
      speech.pitch = 1;
      speech.volume = 1;

      speech.onstart = () => {
        setIsSpeaking(true);
      };

      speech.onend = () => {
        setIsSpeaking(false);
      };

      speech.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(
        speech
      );
    }, []);

  const startDashboardScheduler =
    useCallback(
      (
        dashboardData,
        firstMessage = null
      ) => {
        if (
          typeof window === 'undefined' ||
          window.location.pathname !==
            '/dashboard'
        ) {
          return;
        }

        if (
          dashboardTimerRef.current
        ) {
          window.clearTimeout(
            dashboardTimerRef.current
          );
        }

        const messages =
          buildDashboardMessages(
            dashboardData
          );

        dashboardMessagesRef.current =
          messages;

        dashboardIndexRef.current =
          0;

        sessionStorage.setItem(
          DASHBOARD_QUEUE_KEY,
          JSON.stringify(messages)
        );

        sessionStorage.setItem(
          DASHBOARD_QUEUE_INDEX_KEY,
          '0'
        );

        const first =
          firstMessage ||
          messages[0];

        if (!first) {
          return;
        }

        speakDashboardMessage(first);

        const firstIndex =
          messages.indexOf(first);

        dashboardIndexRef.current =
          firstIndex >= 0
            ? firstIndex + 1
            : 1;

        sessionStorage.setItem(
          DASHBOARD_QUEUE_INDEX_KEY,
          String(
            dashboardIndexRef.current
          )
        );

        const speakNext = () => {
          if (
            window.location.pathname !==
            '/dashboard'
          ) {
            stopDashboardScheduler();
            return;
          }

          const index =
            dashboardIndexRef.current;

          const next =
            dashboardMessagesRef.current[
              index
            ];

          if (!next) {
            dashboardTimerRef.current =
              null;
            return;
          }

          speakDashboardMessage(next);

          dashboardIndexRef.current =
            index + 1;

          sessionStorage.setItem(
            DASHBOARD_QUEUE_INDEX_KEY,
            String(
              dashboardIndexRef.current
            )
          );

          dashboardTimerRef.current =
            window.setTimeout(
              speakNext,
              30000
            );
        };

        // Every message after the first one has
        // a strict 30-second gap.
        dashboardTimerRef.current =
          window.setTimeout(
            speakNext,
            30000
          );
      },
      [
        buildDashboardMessages,
        speakDashboardMessage,
        stopDashboardScheduler,
      ]
    );

  const handleDashboardData =
    useCallback(
      (dashboardData) => {
        if (
          !dashboardData ||
          typeof window === 'undefined' ||
          window.location.pathname !==
            '/dashboard'
        ) {
          return;
        }

        // New login has first priority on Dashboard.
        // This preserves the existing Task 13 login welcome.
        let currentLoginSession = '';

        try {
          currentLoginSession =
            localStorage.getItem('token') ||
            localStorage.getItem('access_token') ||
            '';
        } catch {
          currentLoginSession = '';
        }

        const lastLoginSession =
          sessionStorage.getItem(
            LOGIN_SESSION_KEY
          );

        const isNewLoginSession =
          Boolean(
            currentLoginSession &&
            currentLoginSession !==
              lastLoginSession
          );

        if (isNewLoginSession) {
          sessionStorage.setItem(
            LOGIN_SESSION_KEY,
            currentLoginSession
          );

          sessionStorage.removeItem(
            DASHBOARD_MESSAGE_KEY
          );

          const currentUser =
            getCurrentUser();

          const welcomeMessage =
            getAvatarMessage({
              user: currentUser,
              isNewUser: true,
              isReturningUser: false,
              hasIncompleteInterview: false,
              interviewCompleted: false,
              score: null,
              previousBest: null,
              totalInterviews: 0,
              completedInterviews: 0,
              interviewType: null,
              technicalInterviews: 0,
              nonTechnicalInterviews: 0,
              previousScore: null,
              avatarEvent: null,
            });

          if (
            dashboardData.latestInterviewStatus ===
              'completed' &&
            dashboardData.latestInterviewId
          ) {
            sessionStorage.setItem(
              DASHBOARD_LAST_COMPLETED_KEY,
              String(
                dashboardData.latestInterviewId
              )
            );
          }

          if (welcomeMessage) {
            startDashboardScheduler(
              dashboardData,
              welcomeMessage
            );
            return;
          }
        }

        // ========================================================
        // TASK 14 ONLY — FEEDBACK -> DASHBOARD
        //
        // This takes priority over the normal Dashboard queue.
        // A completed interview must first say "Welcome back..."
        // when the user returns from Feedback.
        // ========================================================
        const feedbackDashboardPending =
          sessionStorage.getItem(
            FEEDBACK_DASHBOARD_PENDING_KEY
          ) === 'true';

        if (
          feedbackDashboardPending &&
          dashboardData.latestInterviewStatus ===
            'completed' &&
          dashboardData.latestInterviewId
        ) {
          sessionStorage.removeItem(
            FEEDBACK_DASHBOARD_PENDING_KEY
          );

          sessionStorage.setItem(
            DASHBOARD_LAST_COMPLETED_KEY,
            String(
              dashboardData.latestInterviewId
            )
          );

          const currentUser =
            getCurrentUser();

          const welcomeBack =
            getAvatarMessage({
              user: currentUser,
              isNewUser: false,
              isReturningUser: true,
              hasIncompleteInterview: false,
              interviewCompleted: false,
              score: null,
              previousBest: null,
              totalInterviews:
                Number(
                  dashboardData.totalInterviews || 0
                ),
              completedInterviews:
                Number(
                  dashboardData.completedInterviews || 0
                ),
              interviewType: null,
              technicalInterviews: 0,
              nonTechnicalInterviews: 0,
              previousScore: null,
              avatarEvent: null,
            });

          startDashboardScheduler(
            dashboardData,
            welcomeBack
          );

          return;
        }

        // A newly completed interview means the user
        // has just returned from Feedback to Dashboard.
        const latestCompletedId =
          dashboardData.latestInterviewStatus ===
            'completed'
            ? dashboardData.latestInterviewId
            : null;

        const lastCompletedId =
          sessionStorage.getItem(
            DASHBOARD_LAST_COMPLETED_KEY
          );

        if (
          latestCompletedId &&
          latestCompletedId !==
            lastCompletedId
        ) {
          sessionStorage.setItem(
            DASHBOARD_LAST_COMPLETED_KEY,
            String(
              latestCompletedId
            )
          );

          const currentUser =
            getCurrentUser();

          const welcomeBack =
            getAvatarMessage({
              user: currentUser,
              isNewUser: false,
              isReturningUser: true,
              hasIncompleteInterview: false,
              interviewCompleted: false,
              score: null,
              previousBest: null,
              totalInterviews:
                Number(
                  dashboardData.totalInterviews ||
                    0
                ),
              completedInterviews:
                Number(
                  dashboardData.completedInterviews ||
                    0
                ),
              interviewType: null,
              technicalInterviews: 0,
              nonTechnicalInterviews: 0,
              previousScore: null,
              avatarEvent: null,
            });

          startDashboardScheduler(
            dashboardData,
            welcomeBack
          );

          return;
        }

        startDashboardScheduler(
          dashboardData
        );
      },
      [
        getCurrentUser,
        startDashboardScheduler,
      ]
    );

  // ==========================================================
  // TASK 13 + TASK 14
  // DASHBOARD INITIALIZATION
  //
  // Dashboard scheduler runs ONLY on /dashboard.
  // Existing Task 14 event handling remains separate.
  // ==========================================================

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      window.location.pathname !==
        '/dashboard'
    ) {
      stopDashboardScheduler();
      return;
    }

    // If a Task 14 event was left in storage after
    // Feedback, consume it here without replaying it.
    // The Dashboard gets its own Task 13 welcome flow.
    const storedAvatarEvent =
      localStorage.getItem(
        AVATAR_EVENT_KEY
      );

    if (storedAvatarEvent) {
      // TASK 14 ONLY:
      // Preserve the existing Task 14 event as a one-time
      // Feedback -> Dashboard trigger before consuming it.
      sessionStorage.setItem(
        FEEDBACK_DASHBOARD_PENDING_KEY,
        'true'
      );

      localStorage.removeItem(
        AVATAR_EVENT_KEY
      );
    }

    let dashboardData = null;

    try {
      const storedDashboardData =
        localStorage.getItem(
          DASHBOARD_DATA_KEY
        );

      if (storedDashboardData) {
        dashboardData =
          JSON.parse(
            storedDashboardData
          );
      }
    } catch (error) {
      console.error(
        'Dashboard avatar data error:',
        error
      );
    }

    if (!dashboardData) {
      return;
    }

    handleDashboardData(
      dashboardData
    );

    return () => {
      stopDashboardScheduler();

      // TASK 14 ONLY:
      // If authentication was actually cleared, reset the login
      // marker so the next successful login speaks Welcome again.
      // Navigation between Dashboard/Round 1/Round 2/Round 3/Feedback
      // keeps the marker because token + user still exist.
      let stillLoggedIn = false;

      try {
        stillLoggedIn = Boolean(
          localStorage.getItem('token') &&
          localStorage.getItem('user')
        );
      } catch {
        stillLoggedIn = false;
      }

      if (!stillLoggedIn) {
        sessionStorage.removeItem(
          LOGIN_SESSION_KEY
        );
      }
    };
  }, [
    handleDashboardData,
    stopDashboardScheduler,
  ]);

  // ==========================================================
  // TASK 13
  // RECEIVE FRESH DASHBOARD DATA
  // ==========================================================

  useEffect(() => {
    const handleFreshDashboardData =
      (event) => {
        if (
          typeof window === 'undefined' ||
          window.location.pathname !==
            '/dashboard'
        ) {
          return;
        }

        const dashboardData =
          event.detail;

        if (!dashboardData) {
          return;
        }

        handleDashboardData(
          dashboardData
        );
      };

    window.addEventListener(
      'mockmind-dashboard-data',
      handleFreshDashboardData
    );

    return () => {
      window.removeEventListener(
        'mockmind-dashboard-data',
        handleFreshDashboardData
      );
    };
  }, [
    handleDashboardData,
  ]);

  // ==========================================================
  // TASK 14
  // STORAGE EVENT
  //
  // EXISTING FUNCTIONALITY PRESERVED
  // ==========================================================

  useEffect(() => {

    const handleStorageChange =
      (event) => {

        // TASK 14 ONLY:
        // A real logout removes token/user. Reset the login marker
        // so the next login can speak the welcome message again.
        if (
          (
            event.key === 'token' ||
            event.key === 'user'
          ) &&
          event.newValue === null
        ) {
          sessionStorage.removeItem(
            LOGIN_SESSION_KEY
          );

          return;
        }

        if (
          event.key !==
          AVATAR_EVENT_KEY
        ) {

          return;

        }


        const avatarEvent =
          event.newValue;


        if (!avatarEvent) {
          return;
        }


        handleAvatarEvent(
          avatarEvent
        );


        /*
         * Consume the event.
         */

        localStorage.removeItem(
          AVATAR_EVENT_KEY
        );

      };


    window.addEventListener(
      'storage',
      handleStorageChange
    );


    return () => {

      window.removeEventListener(
        'storage',
        handleStorageChange
      );

    };

  }, [
    handleAvatarEvent,
  ]);


  // ==========================================================
  // TASK 14
  // SAME-TAB EVENT
  //
  // Existing Round 1 / Round 2 / Feedback event handling.
  // ==========================================================

  useEffect(() => {

    const handleCustomAvatarEvent =
      (event) => {

        const avatarEvent =
          event.detail;


        if (!avatarEvent) {
          return;
        }


        handleAvatarEvent(
          avatarEvent
        );

      };


    window.addEventListener(
      'mockmind-avatar-event',
      handleCustomAvatarEvent
    );


    return () => {

      window.removeEventListener(
        'mockmind-avatar-event',
        handleCustomAvatarEvent
      );

    };

  }, [
    handleAvatarEvent,
  ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="
        w-64
        h-screen
        fixed
        top-0
        left-0
        bg-[#0a0b0d]
        border-r
        border-white/[0.05]
        text-[#f5f1ec]
        flex
        flex-col
        shadow-2xl
        z-20
      "
    >

      {/* =====================================================
          MOCKMIND AI LOGO
          UNCHANGED
      ===================================================== */}

      <div className="p-6 border-b border-white/[0.04] relative">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#f3a078]/[0.03] to-transparent pointer-events-none" />

        <h1
          className="
            text-2xl
            font-bold
            tracking-tight
            relative
            z-10
          "
        >
          <span className="text-[#f5f1ec]">MockMind </span>
          <span className="text-[#f3a078]">AI</span>
        </h1>

      </div>


      {/* =====================================================
          NAVIGATION
          UNCHANGED
      ===================================================== */}

      <nav
        className="
          px-4
          mt-8
          space-y-2
        "
      >

        {navItems.map(
          (item) => (

            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive
                    ? 'bg-[#f3a078]/12 text-[#f3a078] border border-[#f3a078]/30 shadow-[0_0_16px_rgba(243,160,120,0.18)]'
                    : 'text-[#9a9a9a] hover:bg-white/[0.03] hover:text-[#f5f1ec]'
                }`
              }
            >

              <item.icon
                className="
                  w-5
                  h-5
                "
              />

              <span>
                {item.name}
              </span>

            </NavLink>

          )
        )}

      </nav>


      {/* =====================================================
          TASK 13 + TASK 14 — AVATAR

          IMPORTANT:
          Avatar visual itself is untouched.

          Only isSpeaking is connected to speech.
      ===================================================== */}

      <div
        className="
          flex-1
          min-h-0
          flex
          items-center
          justify-center
          overflow-hidden
          relative
        "
      >

        <div className="absolute w-40 h-40 rounded-full bg-[#f3a078]/[0.08] blur-3xl pointer-events-none" />

        <AIAvatar
          isSpeaking={
            isSpeaking
          }
        />

      </div>

    </div>

  );

};


export default Sidebar;