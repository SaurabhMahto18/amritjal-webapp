import { supabase } from "../../../lib/supabase";

const SETTINGS_TABLE = "customer_sms_settings";

async function getCustomerBusinessId(customerId) {
  const { data, error } = await supabase
    .from("customers")
    .select("business_id")
    .eq("id", customerId)
    .single();

  if (error) throw error;

  if (!data?.business_id) {
    throw new Error("Customer ka business ID nahi mila.");
  }

  return data.business_id;
}

function mapReminder(row) {
  return {
    enabled: row.payment_reminder_enabled ?? false,
    channel: row.reminder_channel || "message",
    start_date: row.reminder_start_date || "",
    repeat_type: row.repeat_type || "daily",
    weekdays: row.weekdays || [0, 1, 2, 3, 4, 5, 6],
    month_dates: row.month_dates || [1],
    end_of_month: row.end_of_month ?? false,
  };
}

export const smsSettingsService = {
  async getCustomerSettings(customerId) {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select("*")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      channel: data.channel || "message",
      delivery: data.delivery_enabled ?? false,
      payment_received: data.payment_received_enabled ?? false,
      invoice_ready: data.invoice_ready_enabled ?? false,
      reminder: mapReminder(data),
    };
  },

  async saveCustomerSettings({ customerId, settings, reminder }) {
    const businessId = await getCustomerBusinessId(customerId);

    const payload = {
      business_id: businessId,
      customer_id: customerId,

      channel: settings.channel || "message",
      delivery_enabled: Boolean(settings.delivery),
      payment_received_enabled: Boolean(settings.payment_received),
      invoice_ready_enabled: Boolean(settings.invoice_ready),

      payment_reminder_enabled: Boolean(reminder.enabled),
      reminder_channel: reminder.channel || "message",
      reminder_start_date: reminder.start_date || null,
      repeat_type: reminder.repeat_type || "daily",
      weekdays: reminder.weekdays || [],
      month_dates: reminder.month_dates || [],
      end_of_month: Boolean(reminder.end_of_month),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(payload, { onConflict: "customer_id" })
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};