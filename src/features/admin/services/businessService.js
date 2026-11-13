
import { supabase } from "../../../lib/supabase";

const BUSINESS_FIELDS = `
  id,
  name,
  legal_name,
  phone,
  email,
  address,
  village,
  district,
  state,
  postal_code,
  country,
  logo_url,
  currency_code,
  timezone,
  invoice_prefix,
  default_due_days,
  status,
  owner_id,
  created_by,
  created_at,
  updated_at,
  gst_number,
  pan_number,
  registration_number
`;

function throwIfError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function getCount(table, businessId, filters = {}) {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });

  const { count, error } = await query;

  if (error) {
    return { count: null, error: error.message };
  }

  return { count: count ?? 0, error: null };
}

export async function getBusinessDetails(businessId) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_FIELDS)
    .eq("id", businessId)
    .single();

  return throwIfError({ data, error }, "Unable to load business");
}

export async function getBusinessCustomerStats(businessId) {
  const [total, active, archived] = await Promise.all([
    getCount("customers", businessId),
    getCount("customers", businessId, {
      archived: false,
      status: "active",
    }),
    getCount("customers", businessId, {
      archived: true,
    }),
  ]);

  return {
    total: total.count,
    active: active.count,
    archived: archived.count,
    errors: [total, active, archived]
      .filter((item) => item.error)
      .map((item) => item.error),
  };
}

export async function getBusinessActivityStats(businessId) {
  const [deliveries, invoices, payments] = await Promise.all([
    getCount("deliveries", businessId),
    getCount("invoices", businessId),
    getCount("payments", businessId),
  ]);

  return {
    deliveries: deliveries.count,
    invoices: invoices.count,
    payments: payments.count,
    errors: [deliveries, invoices, payments]
      .filter((item) => item.error)
      .map((item) => item.error),
  };
}

export async function getBusinessSubscription(businessId) {
  const { data, error } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      business_id,
      plan_id,
      status,
      billing_cycle,
      custom_customer_limit,
      active_customer_count,
      is_complimentary,
      full_access_override,
      grant_reason,
      access_expires_at,
      starts_at,
      ends_at,
      trial_ends_at,
      created_at,
      updated_at,
      subscription_plans (
        id,
        code,
        name,
        max_customers,
        is_custom
      )
    `)
    .eq("business_id", businessId)
    .maybeSingle();

  return throwIfError(
    { data, error },
    "Unable to load subscription"
  );
}

export async function getBusinessOverview(businessId) {
  const results = await Promise.allSettled([
    getBusinessDetails(businessId),
    getBusinessCustomerStats(businessId),
    getBusinessActivityStats(businessId),
    getBusinessSubscription(businessId),
  ]);

  const [business, customers, activity, subscription] = results;

  return {
    business:
      business.status === "fulfilled" ? business.value : null,
    customers:
      customers.status === "fulfilled" ? customers.value : null,
    activity:
      activity.status === "fulfilled" ? activity.value : null,
    subscription:
      subscription.status === "fulfilled" ? subscription.value : null,
    errors: results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason?.message || "Unknown error"),
  };
}
