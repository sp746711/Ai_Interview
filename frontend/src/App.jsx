import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layouts
import MainLayout from "./components/layout/MainLayout";
import AuthLayout from "./components/layout/AuthLayout";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import InterviewLayout from "./components/layout/InterviewLayout";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import History from "./pages/history/History";
import Profile from "./pages/profile/Profile";

import Setup from "./pages/interview/Setup";
import Round1 from "./pages/interview/Round1";
import Test from "./pages/interview/Test";
import AIInterview from "./pages/interview/AIInterview";
import Feedback from "./pages/interview/Feedback";

// ======================================================
// PROTECTED ROUTE
// ======================================================

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ======================================================
// APP
// ======================================================

const App = () => {
  return (
    <Routes>

      {/* ==================================================
          PUBLIC ROUTES
      ================================================== */}

      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      {/* ==================================================
          AUTH ROUTES
      ================================================== */}

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          ROUND 1 → ROUND 2 → SETUP

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
        <Route
          path="/round1"
          element={<Round1 />}
        />

        <Route
          path="/test"
          element={<Test />}
        />

        <Route
          path="/setup"
          element={<Setup />}
        />
      </Route>

      {/* ==================================================
          FINAL INTERVIEW / FEEDBACK

          KEEPING CURRENT ROUTING FOR NOW
          WE WILL FIX THEIR LAYOUT SEPARATELY
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

        <Route
          path="/feedback"
          element={<Feedback />}
        />
      </Route>

      {/* ==================================================
          FALLBACK
      ================================================== */}

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />

    </Routes>
  );
};

export default App;