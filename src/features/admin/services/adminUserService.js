import { supabase } from "../../../lib/supabase";

async function invokeAdminUsers(payload) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Admin request failed.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export const getAdminUsers = () =>
  invokeAdminUsers({ action: "list" });

export const invitePlatformAdmin = ({ email, role }) =>
  invokeAdminUsers({
    action: "invite",
    email,
    role,
  });

export const updatePlatformAdminRole = ({ userId, role }) =>
  invokeAdminUsers({
    action: "update_role",
    userId,
    role,
  });

export const updatePlatformAdminStatus = ({ userId, isActive }) =>
  invokeAdminUsers({
    action: "toggle_status",
    userId,
    isActive,
  });