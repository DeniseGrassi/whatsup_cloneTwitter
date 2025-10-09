import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

type AuthCtx = {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUsername: (newUsername: string) => void;
};

const Ctx = createContext<AuthCtx>({
  token: null, username: null, isAuthenticated: false, loading: true,
  login: async () => false, register: async () => false, logout: () => {}, updateUsername: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("username");
    if (t) setToken(t);
    if (u) setUsername(u);

    (async () => {
      try {
        if (t && !u) {
          const res = await api.get<{ username: string }>("/profile/me/");
          if (res?.data?.username) {
            setUsername(res.data.username);
            localStorage.setItem("username", res.data.username);
          }
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setToken(null);
        setUsername(null);
      } finally {
        setLoading(false);
      }
    })();

    if (!t) setLoading(false);
  }, []);

  const login: AuthCtx["login"] = async (user, password) => {
    try {
      const { data } = await api.post<{ token: string; username?: string }>("/login/", { username: user, password });
      if (!data?.token) return false;
      let u = data?.username || user;
      try {
        if (!data?.username) {
          const me = await api.get<{ username: string }>("/profile/me/");
          if (me?.data?.username) u = me.data.username;
        }
      } catch {}
      setToken(data.token); setUsername(u);
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", u);
      return true;
    } catch { return false; }
  };

  const register: AuthCtx["register"] = async (user, email, password) => {
    try { await api.post("/register/", { username: user, email, password }); return await login(user, password); }
    catch { return false; }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
    window.location.href = "/login";
  };

  const updateUsername = (newU: string) => {
    setUsername(newU);
    localStorage.setItem("username", newU);
  };

  const value = useMemo<AuthCtx>(() => ({
    token, username, isAuthenticated: !!token, loading,
    login, register, logout, updateUsername
  }), [token, username, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
