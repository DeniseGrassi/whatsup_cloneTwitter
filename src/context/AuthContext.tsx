
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api"; 

type AuthContextType = {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setToken: (t: string | null) => void;
  login: (ident: string, password: string) => Promise<string>; // retorna o username real
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Props = { children: ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem("username"));

  // sincroniza com o localStorage
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem("username", username);
    else localStorage.removeItem("username");
  }, [username]);

  const login = useCallback(async (identRaw: string, password: string) => {
    const ident = identRaw.trim(); // pode ser usuário OU e-mail

    // 1) faz login
    let data: any;
    try {
      const res = await api.post("/login/", { username: ident, password });
      data = res.data;
    } catch (e) {
      throw new Error("Usuário ou senha inválidos");
    }

    const tok: string | undefined = data?.token;
    if (!tok) throw new Error("Usuário ou senha inválidos");

    // persiste o token logo (para os próximos requests/interceptors)
    localStorage.setItem("token", tok);
    setToken(tok);

    // 2) determina o username “real”
    let realUsername: string | null =
      typeof data?.username === "string" && data.username.trim()
        ? data.username.trim()
        : null;

    if (!realUsername) {
      // backend não retornou username: busca em /users/profile/me/
      try {
        const me = await api.get("/users/profile/me/", {
          headers: { Authorization: `Token ${tok}` }, // não depende do interceptor
        });
        realUsername = me?.data?.username ?? ident;
      } catch {
        realUsername = ident; // fallback
      }
    }

    setUsername(realUsername);
    localStorage.setItem("username", realUsername || "");

    return realUsername!;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }, []);

  const isAuthenticated = useMemo(() => !!token, [token]);

  const value: AuthContextType = useMemo(
    () => ({
      token,
      username,
      isAuthenticated,
      setToken,
      login,
      logout,
    }),
    [token, username, isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook seguro
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}


