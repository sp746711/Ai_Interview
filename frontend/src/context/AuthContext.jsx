import React, {
  createContext,
  useState,
  useEffect,
  useContext,
} from "react";

import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(true);

  // Restore authentication when the application starts
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to restore stored user:", error);

          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const {
        access_token,
        name,
        email: responseEmail,
      } = response.data;

      console.log("LOGIN RESPONSE:", response.data);

      // Store JWT token
      localStorage.setItem("token", access_token);

      // Store logged-in user
      const userData = {
        name: name,
        email: responseEmail || email,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      // Update React state
      setToken(access_token);
      setUser(userData);

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "Login API Error:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Login failed. Please check your credentials.",
      };
    }
  };

  // Register
  const register = async (name, email, password) => {
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      // Automatically login after successful registration
      return await login(email, password);
    } catch (error) {
      console.error(
        "Registration API Error:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data?.detail ||
          "Registration failed.",
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  // Show loading while restoring authentication
  if (loading) {
    return <div>Loading...</div>;
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

// Custom authentication hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

export default AuthContext;