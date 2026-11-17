
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";
import { businessAccessService } from "../services/businessAccessService";

const AuthContext = createContext(null);

const ACCESS_REFRESH_INTERVAL = 30 * 1000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);

  const [businessAccess, setBusinessAccess] = useState(null);
  const [accessError, setAccessError] = useState("");

  // ========================================
  // INITIAL SESSION + AUTH LISTENER
  // ========================================

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const currentSession = await authService.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error("Session load failed:", error.message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    const unsubscribe = authService.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (!nextSession?.user) {
          setBusinessAccess(null);
          setAccessError("");
          setAccessLoading(false);
        }

        setLoading(false);
      }
    );

    loadSession();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ========================================
  // REFRESH BUSINESS ACCESS
  // ========================================

  const refreshBusinessAccess = useCallback(async () => {
    if (!user) {
      setBusinessAccess(null);
      setAccessError("");
      return null;
    }

    setAccessLoading(true);
    setAccessError("");

    try {
      const result =
        await businessAccessService.getCurrentBusinessAccess();

      setBusinessAccess(result);

      return result;
    } catch (error) {
      console.error("Business access check failed:", error);

      setBusinessAccess(null);

      setAccessError(
        error?.message ||
          "Business access could not be verified."
      );

      return null;
    } finally {
      setAccessLoading(false);
    }
  }, [user]);

  // ========================================
  // AUTOMATIC BUSINESS ACCESS REFRESH
  // ========================================

  useEffect(() => {
    if (!user) {
      setBusinessAccess(null);
      setAccessError("");
      return;
    }

    let mounted = true;

    const checkAccess = async () => {
      if (!mounted) return;

      await refreshBusinessAccess();
    };

    checkAccess();

    const interval = window.setInterval(
      checkAccess,
      ACCESS_REFRESH_INTERVAL
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [user, refreshBusinessAccess]);

  // ========================================
  // LOGIN
  // ========================================

  const signIn = useCallback((email, password) => {
    return authService.signIn(email, password);
  }, []);

  // ========================================
  // SIGNUP WITH EMAIL CONFIRMATION
  // ========================================

  const signUp = useCallback(
    (email, password, businessName) => {
      return authService.signUp(
        email,
        password,
        businessName
      );
    },
    []
  );

  // ========================================
  // RESEND CONFIRMATION EMAIL
  // ========================================

  const resendSignupConfirmation = useCallback((email) => {
    return authService.resendSignupConfirmation(email);
  }, []);

  // ========================================
  // CREATE BUSINESS
  // ========================================

  const createBusinessForCurrentUser = useCallback(
    async (businessName) => {
      const result =
        await authService.createBusinessForCurrentUser(
          businessName
        );

      // Immediately refresh business access.
      const access =
        await businessAccessService.getCurrentBusinessAccess();

      setBusinessAccess(access);
      setAccessError("");

      return result;
    },
    []
  );

  // ========================================
  // LOGOUT
  // ========================================

  const signOut = useCallback(async () => {
    await authService.signOut();

    setSession(null);
    setUser(null);
    setBusinessAccess(null);
    setAccessError("");
    setAccessLoading(false);
  }, []);

  // ========================================
  // CONTEXT VALUE
  // ========================================

  const value = {
    session,
    user,
    loading,

    isAuthenticated: Boolean(user),

    businessAccess,
    accessLoading,
    accessError,

    isBusinessSuspended: Boolean(
      businessAccess?.isSuspended
    ),

    hasBusinessAccess: Boolean(
      businessAccess &&
        !businessAccess.isSuspended
    ),

    refreshBusinessAccess,

    signIn,
    signUp,
    resendSignupConfirmation,
    createBusinessForCurrentUser,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// AUTH CONTEXT HOOK
// ========================================

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider."
    );
  }

  return context;
}
