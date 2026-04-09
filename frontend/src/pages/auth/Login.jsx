import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="glass-card max-w-md w-full mx-auto mt-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-[50px] -z-10 rounded-full" />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold neon-text mb-2">Welcome Back</h2>
        <p className="text-gray-400">Sign in to resume your progress</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label-text">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="label-text">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Sign In <LogIn className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-white transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default Login;
