import { supabase } from "../../../lib/supabase";

const RENEWAL_TABLE = "business_subscription_renewals";
const SUBSCRIPTION_TABLE = "business_subscriptions";
const BUSINESS_TABLE = "businesses";
const PLAN_TABLE = "subscription_plans";
const PAYMENT_TABLE = "platform_subscription_payments";

function uniqueIds(rows, key) {
  return [...new Set((rows || []).map((row) => row[key]).filter(Boolean))];
}

async function fetchByIds(table, columns, ids) {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .in("id", ids);

  if (error) throw error;

  return data || [];
}

export const adminRenewalService = {
  /**
   * Fetch renewal records and enrich them with business,
   * subscription plan and payment information.
   */
  async getRenewals() {
    const { data: renewalRows, error: renewalError } = await supabase
      .from(RENEWAL_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (renewalError) throw renewalError;

    const renewals = renewalRows || [];

    const businessIds = uniqueIds(renewals, "business_id");
    const planIds = uniqueIds(renewals, "plan_id");
    const paymentIds = uniqueIds(renewals, "payment_id");

    const [businesses, plans, payments] = await Promise.all([
      fetchByIds(BUSINESS_TABLE, "id, name", businessIds),
      fetchByIds(PLAN_TABLE, "id, name, code", planIds),
      fetchByIds(PAYMENT_TABLE, "*", paymentIds),
    ]);

    const businessMap = new Map(
      businesses.map((business) => [business.id, business])
    );

    const planMap = new Map(
      plans.map((plan) => [plan.id, plan])
    );

    const paymentMap = new Map(
      payments.map((payment) => [payment.id, payment])
    );

    return renewals.map((renewal) => ({
      ...renewal,
      business: businessMap.get(renewal.business_id) || null,
      plan: planMap.get(renewal.plan_id) || null,
      payment: paymentMap.get(renewal.payment_id) || null,
    }));
  },

  /**
   * Fetch current business subscriptions to identify
   * upcoming expirations.
   */
  async getCurrentSubscriptions() {
    const { data: subscriptions, error } = await supabase
      .from(SUBSCRIPTION_TABLE)
      .select("*")
      .order("ends_at", { ascending: true, nullsFirst: false });

    if (error) throw error;

    const rows = subscriptions || [];

    const businessIds = uniqueIds(rows, "business_id");
    const planIds = uniqueIds(rows, "plan_id");

    const [businesses, plans] = await Promise.all([
      fetchByIds(BUSINESS_TABLE, "id, name", businessIds),
      fetchByIds(PLAN_TABLE, "id, name, code", planIds),
    ]);

    const businessMap = new Map(
      businesses.map((business) => [business.id, business])
    );

    const planMap = new Map(
      plans.map((plan) => [plan.id, plan])
    );

    return rows.map((subscription) => ({
      ...subscription,
      business: businessMap.get(subscription.business_id) || null,
      plan: planMap.get(subscription.plan_id) || null,
    }));
  },
};