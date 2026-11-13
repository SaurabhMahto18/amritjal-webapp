
import { getAgencyProfile } from "../../settings/services/settingsService";

import { supabase } from "../../../lib/supabase/client";

/**
 * Get current logged-in business ID.
 *
 * Existing settingsService resolves the business
 * using the authenticated user's owner_id.
 */
export async function getActiveBusinessId() {
  const profile = await getAgencyProfile();
  const businessId = profile?.business?.id;

  if (!businessId) {
    throw new Error("No active business found.");
  }

  return businessId;
}

/**
 * Fetch announcements for the current business.
 * Uses SECURITY DEFINER RPC.
 */
export async function getBusinessAnnouncements(businessId) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  const { data, error } = await supabase.rpc(
    "get_business_announcements",
    {
      p_business_id: businessId,
    }
  );

  if (error) {
    console.error("Announcement fetch failed:", error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Mark an announcement as read.
 * Uses SECURITY DEFINER RPC.
 */
export async function markBusinessAnnouncementRead(
  announcementId,
  businessId
) {
  if (!announcementId || !businessId) {
    throw new Error("Announcement and business IDs are required.");
  }

  const { data, error } = await supabase.rpc(
    "mark_business_announcement_read",
    {
      p_announcement_id: announcementId,
      p_business_id: businessId,
    }
  );

  if (error) {
    console.error("Announcement read update failed:", error);
    throw error;
  }

  return data;
}

/**
 * Get unread announcement count.
 */
export async function getUnreadAnnouncementCount(businessId) {
  const announcements = await getBusinessAnnouncements(businessId);

  return announcements.filter((item) => !item.is_read).length;
}
