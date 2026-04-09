/**
 * Main App component
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Round1 from './pages/Round1';
import Test from './pages/Test';
import Interview from './pages/Interview';
import Feedback from './pages/Feedback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/round1" element={<Round1 />} />
          <Route path="/test/:id" element={<Test />} />
          <Route path="/interview/:id" element={<Interview />} />
          <Route path="/feedback/:id" element={<Feedback />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
