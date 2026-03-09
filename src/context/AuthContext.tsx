import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import * as api from "@/lib/api";

interface AuthContextValue {
  token: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeEmail(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(api.TOKEN_KEY));
  const email = token ? decodeEmail(token) : null;

  useEffect(() => {
    function handleForceLogout() {
      setToken(null);
    }
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  async function login(email: string, password: string) {
    const t = await api.login(email, password);
    localStorage.setItem(api.TOKEN_KEY, t);
    setToken(t);
  }

  async function register(email: string, password: string) {
    await api.register(email, password);
    const t = await api.login(email, password);
    localStorage.setItem(api.TOKEN_KEY, t);
    setToken(t);
  }

  function logout() {
    localStorage.removeItem(api.TOKEN_KEY);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, email, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
