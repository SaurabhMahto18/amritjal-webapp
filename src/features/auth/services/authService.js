
import { supabase } from "../../../lib/supabase/client";

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

const APP_URL = import.meta.env.VITE_APP_URL?.replace(/\/+$/, "");

export const authService = {
  // ========================================
  // EMAIL + PASSWORD LOGIN
  // ========================================
  async signIn(email, password) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw new Error(
        getErrorMessage(error, "Login nahi ho paya.")
      );
    }

    // Do not allow unverified users to continue.
    if (!data?.user?.email_confirmed_at) {
      await supabase.auth.signOut({ scope: "local" });

      throw new Error(
        "Please verify your email address before logging in."
      );
    }

    return data;
  },

  // ========================================
  // SIGNUP WITH EMAIL CONFIRMATION LINK
  // ========================================
  async signUp(email, password, businessName) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const normalizedBusinessName = String(businessName || "").trim();

    if (!normalizedEmail || !normalizedBusinessName || !password) {
      throw new Error(
        "Business name, email and password are required."
      );
    }

    if (password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters long."
      );
    }

    if (!APP_URL || !/^https:\/\//i.test(APP_URL)) {
      throw new Error(
        "Production application URL is not configured."
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${APP_URL}/auth/confirmed`,
        data: {
          business_name: normalizedBusinessName,
        },
      },
    });

    if (error) {
      throw new Error(
        getErrorMessage(error, "Account create nahi ho paya.")
      );
    }

    return data;
  },

  // ========================================
  // RESEND SIGNUP CONFIRMATION EMAIL
  // ========================================
  async resendSignupConfirmation(email) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      throw new Error("Email address required hai.");
    }

    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${APP_URL}/auth/confirmed`,
      },
    });

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Confirmation email resend nahi ho paya."
        )
      );
    }

    return data;
  },

  // ========================================
  // CREATE BUSINESS FOR AUTHENTICATED OWNER
  // ========================================
  async createBusinessForCurrentUser(businessName) {
    const normalizedBusinessName = String(businessName || "").trim();

    if (!normalizedBusinessName) {
      throw new Error("Business name required hai.");
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError) {
      throw new Error(
        getErrorMessage(authError, "User verification failed.")
      );
    }

    const user = authData?.user;

    if (!user) {
      throw new Error("Please sign in again to continue.");
    }

    if (!user.email_confirmed_at) {
      throw new Error("Please verify your email before creating a business.");
    }

    const { data, error } = await supabase.rpc(
      "create_business_for_current_user",
      {
        p_business_name: normalizedBusinessName,
      }
    );

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Business account create nahi ho paya."
        )
      );
    }

    return data;
  },

  // ========================================
  // LOGOUT
  // ========================================
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(
        getErrorMessage(error, "Logout nahi ho paya.")
      );
    }
  },

  // ========================================
  // PASSWORD RESET EMAIL
  // ========================================
  async requestPasswordReset(email) {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      throw new Error("Please enter your email address.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${APP_URL}/reset-password`,
      }
    );

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Password reset email could not be sent."
        )
      );
    }
  },

  // ========================================
  // UPDATE PASSWORD
  // ========================================
  async updatePassword(password) {
    if (typeof password !== "string" || password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters long."
      );
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(
        getErrorMessage(error, "Password could not be updated.")
      );
    }
  },

  // ========================================
  // GET CURRENT SESSION
  // ========================================
  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(
        getErrorMessage(error, "Session load nahi ho paya.")
      );
    }

    return data.session;
  },

  // ========================================
  // GET CURRENT USER
  // ========================================
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(
        getErrorMessage(error, "User load nahi ho paya.")
      );
    }

    return data.user;
  },

  // ========================================
  // AUTH STATE LISTENER
  // ========================================
  onAuthStateChange(callback) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  },
};
