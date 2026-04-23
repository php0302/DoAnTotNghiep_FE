import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import websocketService from '../services/websocketService';

const AuthContext = createContext(null);

/** Dispatch để NotificationContext biết token đã thay đổi */
const notifyAuthChange = () => window.dispatchEvent(new Event('auth-change'));

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục session từ localStorage khi reload trang
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      userService.me()
        .then(({ data }) => setUser(data?.data ?? null))
        .catch(() => {
          localStorage.removeItem('token');
          notifyAuthChange();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail, password) => {
    await authService.login(usernameOrEmail, password);
    const { data } = await userService.me();
    setUser(data?.data ?? null);
    // Báo NotificationContext kết nối WS
    notifyAuthChange();
  };

  const logout = () => {
    websocketService.disconnect();
    authService.logout();
    setUser(null);
    // Báo NotificationContext ngắt WS + clear notifications
    notifyAuthChange();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
