import { supabase } from "../../../lib/supabase/client";

const SETTINGS_TABLE = "customer_sms_settings";

async function getBusinessId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Please log in.");

  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Business profile not found.");

  return data.id;
}

export const smsService = {
  async getCustomers({ filters = {}, page = 1, pageSize = 10 } = {}) {
    const businessId = await getBusinessId();

    let customerIds = null;

    const hasSettingsFilter =
      (filters.channel && filters.channel !== "all") ||
      (filters.delivery && filters.delivery !== "all") ||
      (filters.payment_received && filters.payment_received !== "all") ||
      (filters.invoice_ready && filters.invoice_ready !== "all") ||
      (filters.payment_reminder && filters.payment_reminder !== "all");

    if (hasSettingsFilter) {
      let settingsQuery = supabase
        .from(SETTINGS_TABLE)
        .select("customer_id")
        .eq("business_id", businessId);

      if (filters.channel && filters.channel !== "all") {
        settingsQuery = settingsQuery.eq("channel", filters.channel);
      }

      const booleanFilters = [
        ["delivery", "delivery_enabled"],
        ["payment_received", "payment_received_enabled"],
        ["invoice_ready", "invoice_ready_enabled"],
        ["payment_reminder", "payment_reminder_enabled"],
      ];

      for (const [key, column] of booleanFilters) {
        if (filters[key] === "enabled") {
          settingsQuery = settingsQuery.eq(column, true);
        } else if (filters[key] === "disabled") {
          settingsQuery = settingsQuery.eq(column, false);
        }
      }

      const { data, error } = await settingsQuery;

      if (error) throw error;

      customerIds = (data || []).map((item) => item.customer_id);

      if (!customerIds.length) {
        return { data: [], count: 0 };
      }
    }

    let query = supabase
      .from("customers")
      .select("id, name, phone, group_id", { count: "exact" })
      .eq("business_id", businessId)
      .eq("archived", false)
      .order("name", { ascending: true });

    if (filters.search?.trim()) {
      const search = filters.search.trim().replace(/[,%()]/g, "");

      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Filter using actual group UUID, never the displayed group name.
    if (filters.group_id) {
      query = query.eq("group_id", filters.group_id);
    }

    if (customerIds) {
      query = query.in("id", customerIds);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
    };
  },

  async getCustomerGroups() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("customer_groups")
      .select("id, name")
      .eq("business_id", businessId)
      .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map((group) => ({
      id: group.id,
      name: group.name,
    }));
  },
};