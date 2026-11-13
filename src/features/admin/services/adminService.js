
import { supabase } from "../../../lib/supabase";

/**
 * Verify whether the currently authenticated user
 * is registered as an active platform admin.
 */
export async function verifyPlatformAdmin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return {
      isAdmin: false,
      user: null,
    };
  }

  const { data, error } = await supabase.rpc("is_platform_admin");

  if (error) {
    throw error;
  }

  return {
    isAdmin: data === true,
    user,
  };
}

/**
 * Admin login using Supabase Auth.
 * Authentication alone does not grant admin access.
 */
export async function loginPlatformAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw error;
  }

  try {
    const { data: isAdmin, error: adminError } = await supabase.rpc(
      "is_platform_admin"
    );

    if (adminError) {
      throw adminError;
    }

    if (isAdmin !== true) {
      throw new Error(
        "You are not authorized to access the Amrit Jal Admin Panel."
      );
    }

    return data;
  } catch (error) {
    await supabase.auth.signOut();
    throw error;
  }
}

/**
 * Admin logout.
 */
export async function logoutPlatformAdmin() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Fetch all dashboard statistics using the secure database RPC.
 */
export async function getAdminDashboardStats() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Admin session not found. Please login again.");
  }

  const { data, error } = await supabase.rpc(
    "get_admin_dashboard_stats"
  );

  if (error) {
    throw error;
  }

  if (!data || typeof data !== "object") {
    throw new Error("Invalid dashboard response received.");
  }

  return data;
}
