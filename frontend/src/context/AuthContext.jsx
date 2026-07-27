import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure dynamic base URL for Axios (local dev vs production Vercel)
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
} else if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  axios.defaults.baseURL = 'http://localhost:5000';
} else {
  axios.defaults.baseURL = ''; // Use relative API routes on Vercel deployment
}

// Request Interceptor: Ensure Authorization Bearer token is attached synchronously on ALL requests
axios.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem('sc_token');
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized (e.g. stale token after re-seeding DB) by clearing local storage
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      delete axios.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sc_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('sc_token') || null;
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    return savedToken;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('sc_user', JSON.stringify(res.data.user));
        localStorage.setItem('sc_token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          email: err.response.data.email,
          message: err.response.data.message,
        };
      }
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, phone });
      if (res.data.success) {
        if (res.data.requiresVerification) {
          return {
            success: true,
            requiresVerification: true,
            email: res.data.email,
            message: res.data.message,
          };
        }
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('sc_user', JSON.stringify(res.data.user));
        localStorage.setItem('sc_token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (email, code) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email, code });
      if (res.data.success) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('sc_user', JSON.stringify(res.data.user));
        localStorage.setItem('sc_token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        return { success: true, user: res.data.user, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Verification failed. Please check the code.',
      };
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async (email) => {
    try {
      const res = await axios.post('/api/auth/resend-otp', { email });
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Resend code failed.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sc_user');
    localStorage.removeItem('sc_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/api/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('sc_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Profile update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyOTP, resendOTP, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
