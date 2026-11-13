
import { useCallback, useEffect, useState } from "react";
import { authService } from "../services/authService";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await authService.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setError("");
    } catch (err) {
      setSession(null);
      setUser(null);
      setError(err.message || "Session load nahi ho paya.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = authService.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
      }
    );

    refreshSession();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshSession]);

  const signIn = useCallback(async (email, password) => {
    setError("");
    return authService.signIn(email, password);
  }, []);

  const signUp = useCallback(async (email, password) => {
    setError("");
    return authService.signUp(email, password);
  }, []);

  const signOut = useCallback(async () => {
    setError("");
    await authService.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return {
    session,
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
}
