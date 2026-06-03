import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from 'react';

import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem('token')
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('token');

      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);

        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { access_token, name } = response.data;

      localStorage.setItem('token', access_token);

      const userData = {
        name: name || email.split('@')[0],
        email: email,
      };

      localStorage.setItem(
        'user',
        JSON.stringify(userData)
      );

      setToken(access_token);

      setUser(userData);

      return {
        success: true,
      };

    } catch (error) {
      console.error(
        'Login API Error:',
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
      });

      return await login(email, password);

    } catch (error) {
      console.error(
        'Registration API Error:',
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          'Registration failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');

    localStorage.removeItem('user');

    setToken(null);

    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary-500">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};