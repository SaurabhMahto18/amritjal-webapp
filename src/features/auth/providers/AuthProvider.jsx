
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";
import { businessAccessService } from "../services/businessAccessService";
import { supabase } from "../../../lib/supabase/client";

const AuthContext = createContext(null);

const ACCESS_REFRESH_INTERVAL = 30 * 1000;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(false);

  const [businessAccess, setBusinessAccess] = useState(null);
  const [accessError, setAccessError] = useState("");

  // Registration approval state
  const [registrationRequest, setRegistrationRequest] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

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
        if (mounted) setLoading(false);
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

          setRegistrationRequest(null);
          setRegistrationError("");
          setRegistrationLoading(false);
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
  // REFRESH REGISTRATION REQUEST
  // ========================================

  const refreshRegistrationRequest = useCallback(async () => {
    if (!user) {
      setRegistrationRequest(null);
      setRegistrationError("");
      return null;
    }

    setRegistrationLoading(true);
    setRegistrationError("");

    try {
      const { data, error } = await supabase.rpc(
        "get_my_registration_request"
      );

      if (error) throw error;

      const request = Array.isArray(data)
        ? data[0] || null
        : data;

      setRegistrationRequest(request);

      return request;
    } catch (error) {
      console.error("Registration status check failed:", error);

      setRegistrationRequest(null);

      setRegistrationError(
        error?.message ||
          "Registration status could not be verified."
      );

      return null;
    } finally {
      setRegistrationLoading(false);
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
  // AUTOMATIC REGISTRATION STATUS REFRESH
  // ========================================

  useEffect(() => {
    if (!user) {
      setRegistrationRequest(null);
      setRegistrationError("");
      return;
    }

    refreshRegistrationRequest();
  }, [user, refreshRegistrationRequest]);

  // ========================================
  // LOGIN
  // ========================================

  const signIn = useCallback((email, password) => {
    return authService.signIn(email, password);
  }, []);

  // ========================================
  // SIGNUP
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
  // LEGACY BUSINESS CREATION
  // ========================================

  // New registrations must be approved by an admin.
  // Do not call create_business_for_current_user from signup.

  const createBusinessForCurrentUser = useCallback(async () => {
    throw new Error(
      "Business creation is available only after admin approval."
    );
  }, []);

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

    setRegistrationRequest(null);
    setRegistrationError("");
    setRegistrationLoading(false);
  }, []);

  // ========================================
  // DERIVED REGISTRATION STATES
  // ========================================

  const registrationStatus = registrationRequest?.request_status;

  const isRegistrationPending =
    registrationStatus === "pending";

  const isRegistrationRejected =
    registrationStatus === "rejected";

  const isRegistrationApproved =
    registrationStatus === "approved";

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

    registrationRequest,
    registrationLoading,
    registrationError,
    registrationStatus,

    isRegistrationPending,
    isRegistrationRejected,
    isRegistrationApproved,

    refreshRegistrationRequest,

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
