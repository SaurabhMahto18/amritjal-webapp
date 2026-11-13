
import { supabase } from "../../../lib/supabase";

const ANNOUNCEMENT_FIELDS = `
  id,
  title,
  message,
  announcement_type,
  audience_type,
  status,
  publish_at,
  expires_at,
  created_by,
  created_at,
  updated_at
`;

const VALID_TYPES = [
  "general",
  "important",
  "maintenance",
  "billing",
];

const VALID_AUDIENCES = ["all", "selected"];

const VALID_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "archived",
];

function throwIfError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

function uniqueIds(ids = []) {
  return [...new Set(
    (Array.isArray(ids) ? ids : []).filter(Boolean)
  )];
}

function validatePayload(payload) {
  if (!payload?.title?.trim()) {
    throw new Error("Announcement title is required.");
  }

  if (!payload?.message?.trim()) {
    throw new Error("Announcement message is required.");
  }

  if (!VALID_TYPES.includes(payload.announcement_type)) {
    throw new Error("Invalid announcement type.");
  }

  if (!VALID_AUDIENCES.includes(payload.audience_type)) {
    throw new Error("Invalid announcement audience.");
  }

  if (!VALID_STATUSES.includes(payload.status)) {
    throw new Error("Invalid announcement status.");
  }

  if (!payload.publish_at) {
    throw new Error("Publish date is required.");
  }

  const publishDate = new Date(payload.publish_at);

  if (Number.isNaN(publishDate.getTime())) {
    throw new Error("Invalid publish date.");
  }

  if (payload.expires_at) {
    const expiryDate = new Date(payload.expires_at);

    if (Number.isNaN(expiryDate.getTime())) {
      throw new Error("Invalid expiry date.");
    }

    if (expiryDate <= publishDate) {
      throw new Error("Expiry date must be after publish date.");
    }
  }

  if (
    payload.status === "scheduled" &&
    publishDate <= new Date()
  ) {
    throw new Error(
      "Scheduled announcements require a future publish date."
    );
  }

  if (
    payload.status === "published" &&
    publishDate > new Date()
  ) {
    throw new Error(
      "Published announcements cannot have a future publish date."
    );
  }

  const businessIds = uniqueIds(payload.businessIds);

  if (
    payload.audience_type === "selected" &&
    businessIds.length === 0
  ) {
    throw new Error("Select at least one business.");
  }

  return businessIds;
}

/**
 * Save announcement and audience targets atomically.
 * Database RPC: admin_save_announcement
 */
async function saveAnnouncementRpc(announcementId, payload) {
  const businessIds = validatePayload(payload);

  const args = {
    p_announcement_id: announcementId || null,
    p_title: payload.title.trim(),
    p_message: payload.message.trim(),
    p_announcement_type: payload.announcement_type,
    p_audience_type: payload.audience_type,
    p_status: payload.status,
    p_publish_at: new Date(payload.publish_at).toISOString(),
    p_expires_at: payload.expires_at
      ? new Date(payload.expires_at).toISOString()
      : null,
    p_business_ids:
      payload.audience_type === "selected"
        ? businessIds
        : [],
  };

  const { data, error } = await supabase.rpc(
    "admin_save_announcement",
    args
  );

  const id = throwIfError(
    { data, error },
    "Unable to save announcement"
  );

  if (!id) {
    throw new Error("Announcement save did not return an ID.");
  }

  return id;
}

/**
 * Load admin announcements and basic read statistics.
 */
export async function getAdminAnnouncements() {
  const { data, error } = await supabase
    .from("platform_announcements")
    .select(ANNOUNCEMENT_FIELDS)
    .order("created_at", { ascending: false });

  const announcements = throwIfError(
    { data, error },
    "Unable to load announcements"
  ) || [];

  if (announcements.length === 0) {
    return [];
  }

  const announcementIds = announcements.map((item) => item.id);

  const [targetsResult, readsResult] = await Promise.all([
    supabase
      .from("platform_announcement_targets")
      .select("announcement_id, business_id")
      .in("announcement_id", announcementIds),

    supabase
      .from("business_announcement_reads")
      .select("announcement_id")
      .in("announcement_id", announcementIds),
  ]);

  const targets = throwIfError(
    targetsResult,
    "Unable to load announcement targets"
  ) || [];

  const reads = throwIfError(
    readsResult,
    "Unable to load announcement read receipts"
  ) || [];

  const targetMap = {};
  const readMap = {};

  targets.forEach((target) => {
    targetMap[target.announcement_id] =
      (targetMap[target.announcement_id] || 0) + 1;
  });

  reads.forEach((read) => {
    readMap[read.announcement_id] =
      (readMap[read.announcement_id] || 0) + 1;
  });

  return announcements.map((announcement) => ({
    ...announcement,
    target_count:
      announcement.audience_type === "all"
        ? null
        : targetMap[announcement.id] || 0,
    read_count: readMap[announcement.id] || 0,
  }));
}

/**
 * Load businesses for audience selection.
 */
export async function getAnnouncementBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      legal_name,
      email,
      district,
      state,
      status
    `)
    .order("name", { ascending: true })
    .limit(1000);

  return throwIfError(
    { data, error },
    "Unable to load businesses"
  ) || [];
}

/**
 * Load one announcement with selected audience.
 */
export async function getAnnouncementById(announcementId) {
  if (!announcementId) {
    throw new Error("Announcement ID is required.");
  }

  const { data, error } = await supabase
    .from("platform_announcements")
    .select(ANNOUNCEMENT_FIELDS)
    .eq("id", announcementId)
    .single();

  const announcement = throwIfError(
    { data, error },
    "Unable to load announcement"
  );

  const { data: targets, error: targetError } = await supabase
    .from("platform_announcement_targets")
    .select("business_id")
    .eq("announcement_id", announcementId);

  if (targetError) {
    throw new Error(
      `Unable to load announcement targets: ${targetError.message}`
    );
  }

  return {
    ...announcement,
    businessIds: (targets || []).map(
      (item) => item.business_id
    ),
  };
}

/**
 * Create announcement through transactional RPC.
 */
export async function createAnnouncement(payload) {
  const announcementId = await saveAnnouncementRpc(null, payload);

  return getAnnouncementById(announcementId);
}

/**
 * Update announcement and its targets through one transaction.
 */
export async function updateAnnouncement(announcementId, payload) {
  if (!announcementId) {
    throw new Error("Announcement ID is required.");
  }

  await saveAnnouncementRpc(announcementId, payload);

  return getAnnouncementById(announcementId);
}

/**
 * Publish immediately.
 */
export async function publishAnnouncement(announcementId) {
  if (!announcementId) {
    throw new Error("Announcement ID is required.");
  }

  const existing = await getAnnouncementById(announcementId);

  if (existing.status === "archived") {
    throw new Error("Archived announcements cannot be published.");
  }

  const now = new Date();

  if (
    existing.expires_at &&
    new Date(existing.expires_at) <= now
  ) {
    throw new Error(
      "This announcement has already expired. Update its expiry before publishing."
    );
  }

  const payload = {
    ...existing,
    status: "published",
    publish_at: now.toISOString(),
    businessIds: existing.businessIds,
  };

  await saveAnnouncementRpc(announcementId, payload);

  return getAnnouncementById(announcementId);
}

/**
 * Archive announcement.
 */
export async function archiveAnnouncement(announcementId) {
  if (!announcementId) {
    throw new Error("Announcement ID is required.");
  }

  const existing = await getAnnouncementById(announcementId);

  const payload = {
    ...existing,
    status: "archived",
    businessIds: existing.businessIds,
  };

  await saveAnnouncementRpc(announcementId, payload);

  return getAnnouncementById(announcementId);
}

/**
 * Business-side announcement fetch.
 * Uses the business-specific secure RPC.
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

  return throwIfError(
    { data, error },
    "Unable to load business announcements"
  ) || [];
}

/**
 * Mark announcement as read through secure RPC.
 * Returns true only when a new read receipt was inserted.
 */
export async function markBusinessAnnouncementRead(
  announcementId,
  businessId
) {
  if (!announcementId || !businessId) {
    throw new Error(
      "Announcement ID and business ID are required."
    );
  }

  const { data, error } = await supabase.rpc(
    "mark_business_announcement_read",
    {
      p_announcement_id: announcementId,
      p_business_id: businessId,
    }
  );

  return throwIfError(
    { data, error },
    "Unable to mark announcement as read"
  );
}
