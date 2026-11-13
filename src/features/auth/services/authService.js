
import { supabase } from "../../../lib/supabase/client";

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export const authService = {
  // Email aur password se login
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
      password,
    });

    if (error) {
      throw new Error(getErrorMessage(error, "Login nahi ho paya."));
    }

    return data;
  },

  // Naya account create karna
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email: String(email || "").trim(),
      password,
    });

    if (error) {
      throw new Error(
        getErrorMessage(error, "Account create nahi ho paya.")
      );
    }

    return data;
  },

  // Current user ko logout karna
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(getErrorMessage(error, "Logout nahi ho paya."));
    }
  },


  async requestPasswordReset(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) throw new Error("Please enter your email address.");
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(getErrorMessage(error, "Password reset email could not be sent."));
  },

  async updatePassword(password) {
    if (typeof password !== "string" || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(getErrorMessage(error, "Password could not be updated."));
  },

  // Existing login session check karna
  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(
        getErrorMessage(error, "Session load nahi ho paya.")
      );
    }

    return data.session;
  },

  // Login/logout aur session changes sunna
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
