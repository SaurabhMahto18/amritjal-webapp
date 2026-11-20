
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

  if (userError) throw userError;

  if (!user) {
    return {
      isAdmin: false,
      user: null,
    };
  }

  const { data, error } = await supabase.rpc(
    "is_current_user_admin"
  );

  if (error) throw error;

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

  if (error) throw error;

  try {
    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_current_user_admin");

    if (adminError) throw adminError;

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

  if (error) throw error;

  return true;
}

/**
 * Fetch dashboard statistics using the existing secure RPC.
 */
export async function getAdminDashboardStats() {
  const { isAdmin, user } = await verifyPlatformAdmin();

  if (!user || !isAdmin) {
    throw new Error("Admin access required. Please login again.");
  }

  const { data, error } = await supabase.rpc(
    "get_admin_dashboard_stats"
  );

  if (error) throw error;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid dashboard response received.");
  }

  return data;
}

/**
 * Fetch all business registration requests.
 * Admin authorization is also checked inside the database RPC.
 */
export async function getRegistrationRequests() {
  const { data, error } = await supabase.rpc(
    "get_admin_registration_requests"
  );

  if (error) throw error;

  return data || [];
}

/**
 * Fetch current user's registration request.
 */
export async function getMyRegistrationRequest() {
  const { data, error } = await supabase.rpc(
    "get_my_registration_request"
  );

  if (error) throw error;

  return Array.isArray(data) ? data[0] || null : data;
}

/**
 * Submit a business registration request.
 */
export async function submitBusinessRegistration(businessName) {
  const normalizedName = businessName?.trim();

  if (!normalizedName || normalizedName.length > 120) {
    throw new Error(
      "Business name must be between 1 and 120 characters."
    );
  }

  const { data, error } = await supabase.rpc(
    "submit_business_registration",
    {
      p_business_name: normalizedName,
    }
  );

  if (error) throw error;

  return Array.isArray(data) ? data[0] : data;
}

/**
 * Approve a pending business registration.
 * Database RPC creates the business and owner membership.
 */
export async function approveBusinessRegistration(requestId) {
  if (!requestId) {
    throw new Error("Registration request ID is required.");
  }

  const { data, error } = await supabase.rpc(
    "approve_business_registration",
    {
      p_request_id: requestId,
    }
  );

  if (error) throw error;

  return Array.isArray(data) ? data[0] : data;
}

/**
 * Reject a pending business registration.
 */
export async function rejectBusinessRegistration(
  requestId,
  reason
) {
  const normalizedReason = reason?.trim();

  if (!requestId) {
    throw new Error("Registration request ID is required.");
  }

  if (!normalizedReason || normalizedReason.length > 500) {
    throw new Error(
      "Rejection reason must be between 1 and 500 characters."
    );
  }

  const { data, error } = await supabase.rpc(
    "reject_business_registration",
    {
      p_request_id: requestId,
      p_reason: normalizedReason,
    }
  );

  if (error) throw error;

  return data;
}
