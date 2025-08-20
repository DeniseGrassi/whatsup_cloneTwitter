
import React, {
  createContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useContext,
} from "react";

const API_BASE = "http://127.0.0.1:8000/api";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// INICIALIZA COMO UNDEFINED!
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem("username", username);
    else localStorage.removeItem("username");
  }, [username]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Usuário ou senha inválidos");
    const data = await res.json();
    setToken(data.token);
    setUsername(username);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, setToken, username, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook seguro:
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}




