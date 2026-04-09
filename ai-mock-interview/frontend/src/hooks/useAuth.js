/**
 * Custom hook for authentication
 */
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const register = async (email, username, password) => {
    setLoading(true);
    try {
      const response = await authAPI.register({ email, username, password });
      localStorage.setItem('token', response.data.access_token);
      context.setUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.data.access_token);
      context.setUser(response.data.user);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    context.setUser(null);
  };

  return {
    register,
    login,
    logout,
    loading,
    error,
    user: context.user,
  };
};
