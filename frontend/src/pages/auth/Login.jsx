import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Target,
  BarChart3,
} from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="login-page-root">
      {/* --------------------------------------------------
          LEFT PANEL — Cinematic Developer Workspace (No Plant)
          -------------------------------------------------- */}
      <div className="login-left-panel">
        <div className="login-left-glow" />

        {/* Top Brand */}
        <div className="login-left-top">
          <Link to="/" className="login-brand-link">
            <div className="login-brand-icon">
              <Bot size={22} />
            </div>
            <span className="login-brand-text">
              MockMind <span className="login-brand-accent">AI</span>
            </span>
          </Link>
          <p className="login-brand-tagline">Practice Today. Perform Tomorrow.</p>
        </div>

        {/* Center Hero Content & Benefits */}
        <div className="login-left-center">
          <h1 className="login-hero-headline">
            Prepare Smarter.<br />
            <span className="login-hero-accent">Go Further.</span>
          </h1>
          <p className="login-hero-description">
            AI-powered interview preparation designed to help you build confidence and achieve your career goals.
          </p>

          <div className="login-benefits-list">
            <div className="login-benefit-item">
              <div className="login-benefit-icon-box">
                <Target size={16} />
              </div>
              <div className="login-benefit-text-wrap">
                <h3 className="login-benefit-title">Personalized Practice</h3>
                <p className="login-benefit-desc">Tailored to your goals</p>
              </div>
            </div>

            <div className="login-benefit-item">
              <div className="login-benefit-icon-box">
                <Bot size={16} />
              </div>
              <div className="login-benefit-text-wrap">
                <h3 className="login-benefit-title">Real Interview Experience</h3>
                <p className="login-benefit-desc">Practice with realistic scenarios</p>
              </div>
            </div>

            <div className="login-benefit-item">
              <div className="login-benefit-icon-box">
                <BarChart3 size={16} />
              </div>
              <div className="login-benefit-text-wrap">
                <h3 className="login-benefit-title">Actionable Feedback</h3>
                <p className="login-benefit-desc">Get insights and improve faster</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Motivational Quote */}
        <div className="login-left-bottom">
          <blockquote className="login-quote-text">
            “A better you for a brighter tomorrow.”
          </blockquote>
          <p className="login-quote-author">— MockMind AI</p>
        </div>
      </div>

      {/* --------------------------------------------------
          RIGHT PANEL — Login Form Card
          -------------------------------------------------- */}
      <div className="login-right-panel">
        {/* Mobile-only brand header */}
        <Link to="/" className="login-mobile-brand">
          <div className="login-mobile-brand-row">
            <div className="login-brand-icon" style={{ width: 34, height: 34 }}>
              <Bot size={18} />
            </div>
            <span className="login-brand-text" style={{ fontSize: '1.2rem' }}>
              MockMind <span className="login-brand-accent">AI</span>
            </span>
          </div>
          <p className="login-brand-tagline">Practice Today. Perform Tomorrow.</p>
        </Link>

        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-badge">
              <Bot size={14} />
              <span>MockMind AI</span>
            </div>
            <h2 className="login-card-title">
              Welcome <span className="login-brand-accent">Back</span>
            </h2>
            <p className="login-card-subtitle">
              Sign in to continue your interview preparation journey.
            </p>
          </div>

          {error && (
            <div className="login-error-box">
              <AlertCircle size={16} className="login-error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field-group">
              <label className="login-label">Email Address</label>
              <div className="login-input-wrap">
                <Mail size={17} className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <Loader2 size={19} className="login-spinner" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="login-card-footer">
            Don't have an account?{' '}
            <Link to="/register" className="login-register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
