import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ======================================================
// TASK 14 ONLY
// Global avatar event listener
// ======================================================

import getAvatarMessage from "./components/ai/avatarLogic";

// Layouts
import MainLayout from "./components/dashboard/layout/MainLayout";
import AuthLayout from "./components/dashboard/layout/AuthLayout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import InterviewLayout from "./components/dashboard/layout/InterviewLayout";

// Pages — Task 17 Landing
import LandingLayout from "./components/landing/LandingLayout";
import LandingHome from "./pages/landing/Home";
import LandingFeatures from "./pages/landing/Features";
import LandingHowItWorks from "./pages/landing/HowItWorks";
import LandingWhyMockMind from "./pages/landing/WhyMockMind";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import History from "./pages/history/History";
import Profile from "./pages/profile/Profile";

import Setup from "./pages/interview/Setup";
import Round1 from "./pages/interview/Round1";

// ======================================================
// TASK 15
// Round 1 Feedback
// ======================================================

import Round1Feedback from "./pages/interview/Round1Feedback";

import Test from "./pages/interview/Test";
import AIInterview from "./pages/interview/AIInterview";
import Feedback from "./pages/interview/Feedback";

// ======================================================
// TASK 14 ONLY
// GLOBAL AVATAR EVENT LISTENER
// ======================================================

const AvatarEventListener = () => {
  const { user } = useAuth();

  useEffect(() => {
    const handleAvatarEvent = (event) => {
      const avatarEvent = event.detail;

      if (!avatarEvent) {
        return;
      }

      // ==================================================
      // TASK 14 ONLY
      // Consume the event immediately.
      // ==================================================

      localStorage.removeItem(
        "mockmind_avatar_event"
      );

      // --------------------------------------------------
      // Get current logged-in user
      // --------------------------------------------------

      let currentUser = user;

      if (!currentUser) {
        try {
          const storedUser =
            localStorage.getItem("user");

          if (storedUser) {
            currentUser = JSON.parse(
              storedUser
            );
          }
        } catch (error) {
          console.error(
            "Avatar user data error:",
            error
          );
        }
      }

      // --------------------------------------------------
      // Existing Task 14 message logic
      // --------------------------------------------------

      const message = getAvatarMessage({
        user: currentUser,

        avatarEvent,

        isNewUser: false,
        isReturningUser: false,
        hasIncompleteInterview: false,
        interviewCompleted: false,

        score: null,
        previousBest: null,

        totalInterviews: 0,
        completedInterviews: 0,

        interviewType: null,
      });

      if (!message) {
        return;
      }

      // --------------------------------------------------
      // Speak existing Task 14 message
      // --------------------------------------------------

      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
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

      window.speechSynthesis.speak(
        speech
      );
    };

    // ====================================================
    // Same-tab Task 14 events
    // ====================================================

    window.addEventListener(
      "mockmind-avatar-event",
      handleAvatarEvent
    );

    // ====================================================
    // Cleanup
    // ====================================================

    return () => {
      window.removeEventListener(
        "mockmind-avatar-event",
        handleAvatarEvent
      );
    };
  }, [user]);

  return null;
};

// ======================================================
// PROTECTED ROUTE
// ======================================================

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

// ======================================================
// APP
// ======================================================

const App = () => {
  return (
    <>
      {/* ==================================================
          TASK 14 ONLY

          Global listener remains mounted during:

          Dashboard
             ↓
          Round 1
             ↓
          Round 1 Feedback
             ↓
          Round 2
             ↓
          Final Interview
             ↓
          Feedback
      ================================================== */}

      <AvatarEventListener />

      <Routes>

        {/* ==================================================
            TASK 17 — PUBLIC LANDING ROUTES
        ================================================== */}

        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingHome />} />
          <Route path="/features" element={<LandingFeatures />} />
          <Route path="/how-it-works" element={<LandingHowItWorks />} />
          <Route path="/why-mockmind" element={<LandingWhyMockMind />} />
        </Route>

        {/* ==================================================
            AUTH ROUTES
        ================================================== */}

        <Route element={<AuthLayout />}>

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

        </Route>

        {/* ==================================================
            DASHBOARD ROUTES
            Sidebar + Welcome Header
        ================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/history"
            element={<History />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>

        {/* ==================================================
            ROUND 1 → ROUND 1 FEEDBACK → ROUND 2 → SETUP

            NO SIDEBAR
            WELCOME HEADER PRESENT
        ================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <InterviewLayout />
            </ProtectedRoute>
          }
        >

          {/* ROUND 1 */}

          <Route
            path="/round1"
            element={<Round1 />}
          />

          {/* ==================================================
              TASK 15
              ROUND 1 FEEDBACK
          ================================================== */}

          <Route
            path="/round1-feedback"
            element={<Round1Feedback />}
          />

          {/* ROUND 2 */}

          <Route
            path="/test"
            element={<Test />}
          />

          {/* SETUP */}

          <Route
            path="/setup"
            element={<Setup />}
          />

        </Route>

        {/* ==================================================
            FINAL INTERVIEW
            KEEP EXISTING LAYOUT
        ================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/ai-interview"
            element={<AIInterview />}
          />

        </Route>

        {/* ==================================================
            TASK 15
            FINAL FEEDBACK

            IMPORTANT:
            Feedback is intentionally OUTSIDE MainLayout.

            Therefore:
            ❌ No left sidebar
            ❌ No Dashboard menu
            ❌ No Start Interview menu
            ❌ No History menu
            ❌ No Profile menu
            ❌ No Logout menu

            ✅ Feedback page only
            ✅ Round 1 → Round 2 → Round 3
            ================================================== */}

        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            FALLBACK
        ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </>
  );
};

export default App;