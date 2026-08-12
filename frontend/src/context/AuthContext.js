import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=guest, obj=user
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vl_token");
    if (!token) {
      setUser(false);
      setReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem("vl_token");
        setUser(false);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(() => {
    const login = (token, u) => {
      localStorage.setItem("vl_token", token);
      setUser(u);
    };
    const logout = () => {
      localStorage.removeItem("vl_token");
      setUser(false);
    };
    return { user, ready, login, logout };
  }, [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
