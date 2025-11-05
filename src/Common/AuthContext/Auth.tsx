// src/Common/AuthContext/Auth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 🔒 Logout
  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = "/admin/login";
  };

  // 🔑 Login
  const login = (accessToken: string, refreshToken: string, userData: User) => {
    const expireAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 15 mins expiry for access token
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token_expire", expireAt.toString());
    setUser(userData);
  };

  // ♻️ Refresh Access Token
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return logout();

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
      const newToken = res.data.accessToken;
      const expireAt = Date.now() + 15 * 60 * 1000; // 15 mins again
      localStorage.setItem("token", newToken);
      localStorage.setItem("token_expire", expireAt.toString());
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  // 🔍 Check token on load (Safe JSON parse)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserRaw = localStorage.getItem("user");
    const expireAt = Number(localStorage.getItem("token_expire") || 0);

    let storedUser: User | null = null;
    if (storedUserRaw) {
      try {
        storedUser = JSON.parse(storedUserRaw);
      } catch (err) {
        console.warn("⚠️ Failed to parse stored user:", err);
        storedUser = null;
        localStorage.removeItem("user"); // remove corrupted data
      }
    }

    if (token && storedUser) {
      if (Date.now() > expireAt) {
        refreshAccessToken();
      } else {
        setUser(storedUser);
        const remainingTime = expireAt - Date.now();
        setTimeout(refreshAccessToken, remainingTime - 5000); // refresh 5s before expiry
      }
    }

    setIsAuthReady(true);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthReady, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
