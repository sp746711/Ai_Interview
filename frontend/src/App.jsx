import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/dashboard/DashboardLayout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Setup from './pages/interview/Setup';
import Round1 from './pages/interview/Round1';
import Test from './pages/interview/Test';
import AIInterview from './pages/interview/AIInterview';
import Feedback from './pages/interview/Feedback';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Route wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* New SaaS Dashboard Layout block exclusively for /dashboard */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* Protected Routes inside MainLayout for backwards compatibility with dark theme pages */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/setup" element={<Setup />} />
        <Route path="/round1" element={<Round1 />} />
        <Route path="/test" element={<Test />} />
        <Route path="/ai-interview" element={<AIInterview />} />
        <Route path="/feedback" element={<Feedback />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
