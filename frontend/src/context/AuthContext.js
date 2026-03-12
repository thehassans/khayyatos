import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import i18n from '../i18n';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    localStorage.setItem('theme', 'light');
  }, []);

  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }, []);

  useEffect(() => {
    const requestInterceptorId = api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });

    const responseInterceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logoutRef.current?.();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptorId);
      api.interceptors.response.eject(responseInterceptorId);
    };
  }, [api]);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/verify');
          const userData = response.data.user;
          setUser(userData);
          if (userData?.theme) {
            localStorage.setItem('theme', userData.theme);
          }
          if (userData?.language) {
            const lang = String(userData.language).split('-')[0];
            if (lang) i18n.changeLanguage(lang);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [api, token]);

  useEffect(() => {
    const root = document.documentElement;
    const preferred = user?.theme || localStorage.getItem('theme') || 'light';
    root.classList.toggle('dark', preferred === 'dark');
  }, [user?.theme]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token: newToken, user: userData, role } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      if (userData?.theme) localStorage.setItem('theme', userData.theme);
      if (userData?.language) {
        const lang = String(userData.language).split('-')[0];
        if (lang) i18n.changeLanguage(lang);
      }
      return { success: true, user: userData, role };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const loginDemo = async () => {
    try {
      const response = await api.post('/auth/demo');
      const { token: newToken, user: userData, role } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('theme', 'light');
      return { success: true, user: userData, role: role || 'user' };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Demo login failed' };
    }
  };

  const loginAsUser = async (userId) => {
    try {
      const response = await api.post(`/admin/users/${userId}/login-as`);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const loginAsWorker = async (workerId) => {
    try {
      const response = await api.post(`/worker/login-as/${workerId}`);
      const { token: newToken, user: userData, role } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      if (userData?.language) {
        const lang = String(userData.language).split('-')[0];
        if (lang) i18n.changeLanguage(lang);
      }
      return { success: true, user: userData, role };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed' };
    }
  };

  const loginAsFinisher = async (finisherId, userId) => {
    try {
      const config = userId ? { headers: { 'x-login-as-user': userId } } : undefined;
      const response = await api.post(`/finisher/login-as/${finisherId}`, {}, config);
      const { token: newToken, user: userData, role } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      if (userData?.language) {
        const lang = String(userData.language).split('-')[0];
        if (lang) i18n.changeLanguage(lang);
      }
      return { success: true, user: userData, role };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed' };
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    if (userData?.theme) {
      localStorage.setItem('theme', userData.theme);
    }
    if (userData?.language) {
      const lang = String(userData.language).split('-')[0];
      if (lang) i18n.changeLanguage(lang);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      api,
      login,
      loginDemo,
      logout,
      loginAsUser,
      loginAsWorker,
      loginAsFinisher,
      updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isUser: user?.role === 'user',
      isWorker: user?.role === 'worker',
      isFinisher: user?.role === 'finisher'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
