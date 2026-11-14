
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { authApi } from "../api/client.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "astra_access_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(() =>
    Boolean(sessionStorage.getItem(TOKEN_KEY))
  );

  // Check the logged-in user when the token changes
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    // GET /api/auth/me
    authApi.me(token)
      .then((result) => {
        if (active) {
          setUser(result.user);
        }
      })
      .catch(() => {
        if (!active) return;

        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  // POST /api/auth/login
  async function signIn(username, password) {
    const result = await authApi.login({
      username,
      password
    });

    if (!result.token) {
      throw new Error(
        "The server did not return an authentication token."
      );
    }

    // Verify token with GET /api/auth/me
    const profile = await authApi.me(result.token);

    if (!profile.user) {
      throw new Error("Could not load user profile.");
    }

    sessionStorage.setItem(
      TOKEN_KEY,
      result.token
    );

    setToken(result.token);
    setUser(profile.user);
    setLoading(false);

    return profile.user;
  }

  // Logout
  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
