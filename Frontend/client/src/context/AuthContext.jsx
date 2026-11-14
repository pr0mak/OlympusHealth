import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/client.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "astra_access_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    authApi.me(token)
      .then((result) => { if (active) setUser(result.user); })
      .catch(() => {
        if (!active) return;
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function signIn(email, password) {
    const result = await authApi.login({ email, password });
    if (!result.token) throw new Error("The server did not return a token.");
    // Verify /me before treating the user as signed in.
    const profile = await authApi.me(result.token);
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(profile.user);
    setLoading(false);
    return profile.user;
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
