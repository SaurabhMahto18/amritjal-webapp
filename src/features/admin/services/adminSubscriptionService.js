
import { supabase } from "../../../lib/supabase";

// =========================================================
// CONSTANTS
// =========================================================

const PROOF_BUCKET = "subscription-payment-proofs";

const SUBSCRIPTION_FIELDS = `
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
  granted_by,
  access_expires_at,
  starts_at,
  ends_at,
  trial_ends_at,
  created_at,
  updated_at,
  businesses (
    id,
    name,
    email,
    phone
  ),
  subscription_plans (
    id,
    code,
    name,
    max_customers,
    is_custom,
    is_active
  )
`;

const PLAN_FIELDS = `
  id,
  code,
  name,
  description,
  max_customers,
  price_monthly,
  price_yearly,
  is_custom,
  is_active
`;

const PAYMENT_FIELDS = `
  id,
  business_id,
  subscription_id,
  plan_id,
  amount,
  currency,
  payment_status,
  payment_method,
  payment_provider,
  provider_payment_id,
  provider_order_id,
  reference_no,
  billing_cycle,
  period_start,
  period_end,
  paid_at,
  proof_storage_path,
  rejection_reason,
  reviewed_by,
  reviewed_at,
  notes,
  created_by,
  created_at,
  updated_at,
  businesses (
    id,
    name,
    email,
    phone
  ),
  subscription_plans (
    id,
    code,
    name,
    max_customers,
    is_custom,
    is_active
  )
`;

const ALLOWED_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "cancelled",
  "expired",
  "suspended",
];

const ALLOWED_BILLING_CYCLES = [
  "monthly",
  "yearly",
  "custom",
];

const ALLOWED_PAYMENT_STATUSES = [
  "pending",
  "successful",
  "failed",
  "refunded",
  "rejected",
];

// =========================================================
// VALIDATION
// =========================================================

function validateSubscriptionPayload(payload = {}) {
  if (!payload.plan_id) {
    throw new Error("Please select a subscription plan.");
  }

  if (!ALLOWED_STATUSES.includes(payload.status)) {
    throw new Error("Invalid subscription status.");
  }

  if (!ALLOWED_BILLING_CYCLES.includes(payload.billing_cycle)) {
    throw new Error("Invalid billing cycle.");
  }

  if (
    typeof payload.is_complimentary !== "boolean" ||
    typeof payload.full_access_override !== "boolean"
  ) {
    throw new Error("Invalid subscription access settings.");
  }

  const customLimit =
    payload.custom_customer_limit === "" ||
    payload.custom_customer_limit === undefined
      ? null
      : payload.custom_customer_limit;

  if (
    customLimit !== null &&
    (!Number.isInteger(Number(customLimit)) ||
      Number(customLimit) < 0)
  ) {
    throw new Error(
      "Custom customer limit must be a non-negative integer."
    );
  }

  if (
    payload.full_access_override &&
    !String(payload.grant_reason || "").trim()
  ) {
    throw new Error(
      "A reason is required for full-access override."
    );
  }

  if (!payload.granted_by) {
    throw new Error("Admin identity could not be verified.");
  }

  let accessExpiresAt = null;

  if (payload.access_expires_at) {
    const parsedDate = new Date(payload.access_expires_at);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error("Invalid access expiry date.");
    }

    accessExpiresAt = parsedDate.toISOString();
  }

  return {
    plan_id: payload.plan_id,
    status: payload.status,
    billing_cycle: payload.billing_cycle,
    custom_customer_limit:
      customLimit === null ? null : Number(customLimit),
    is_complimentary: payload.is_complimentary,
    full_access_override: payload.full_access_override,
    grant_reason: String(payload.grant_reason || "").trim() || null,
    granted_by: payload.granted_by,
    access_expires_at: accessExpiresAt,
    updated_at: new Date().toISOString(),
  };
}

// =========================================================
// ADMIN SUBSCRIPTION SERVICE
// =========================================================

export const adminSubscriptionService = {
  // -------------------------------------------------------
  // SUBSCRIPTIONS
  // -------------------------------------------------------

  /**
   * Fetch all business subscriptions with business and plan details.
   */
  async getSubscriptions() {
    const { data, error } = await supabase
      .from("business_subscriptions")
      .select(SUBSCRIPTION_FIELDS)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  },

  /**
   * Fetch active plans available for subscription assignment.
   */
  async getActivePlans() {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select(PLAN_FIELDS)
      .eq("is_active", true)
      .order("max_customers", {
        ascending: true,
        nullsFirst: false,
      });

    if (error) throw error;

    return data || [];
  },

  /**
   * Fetch subscriptions and active plans together.
   */
  async getAdminSubscriptionData() {
    const [subscriptions, plans] = await Promise.all([
      this.getSubscriptions(),
      this.getActivePlans(),
    ]);

    return {
      subscriptions,
      plans,
    };
  },

  /**
   * Update an existing business subscription.
   */
  async updateSubscription(subscriptionId, payload) {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required.");
    }

    const cleanPayload = validateSubscriptionPayload(payload);

    const { data, error } = await supabase
      .from("business_subscriptions")
      .update(cleanPayload)
      .eq("id", subscriptionId)
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
        granted_by,
        access_expires_at,
        starts_at,
        ends_at,
        trial_ends_at,
        updated_at
      `)
      .single();

    if (error) throw error;

    if (!data || data.id !== subscriptionId) {
      throw new Error(
        "Subscription update could not be verified."
      );
    }

    return data;
  },

  /**
   * Alias for updating an existing subscription.
   */
  async saveSubscription(subscriptionId, payload) {
    return this.updateSubscription(subscriptionId, payload);
  },

  /**
   * Get one subscription by its ID.
   */
  async getSubscriptionById(subscriptionId) {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required.");
    }

    const { data, error } = await supabase
      .from("business_subscriptions")
      .select(SUBSCRIPTION_FIELDS)
      .eq("id", subscriptionId)
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Get subscriptions belonging to one business.
   */
  async getBusinessSubscriptions(businessId) {
    if (!businessId) {
      throw new Error("Business ID is required.");
    }

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
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  },

  // -------------------------------------------------------
  // SUBSCRIPTION PAYMENTS
  // -------------------------------------------------------

  /**
   * Fetch all subscription payments for admin.
   */
  async getSubscriptionPayments(filters = {}) {
    let query = supabase
      .from("platform_subscription_payments")
      .select(PAYMENT_FIELDS)
      .order("created_at", { ascending: false });

    if (
      filters.status &&
      ALLOWED_PAYMENT_STATUSES.includes(filters.status)
    ) {
      query = query.eq("payment_status", filters.status);
    }

    if (filters.businessId) {
      query = query.eq("business_id", filters.businessId);
    }

    if (filters.fromDate) {
      query = query.gte("created_at", filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte("created_at", filters.toDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  },

  /**
   * Fetch payments waiting for admin verification.
   */
  async getPendingSubscriptionPayments() {
    const { data, error } = await supabase
      .from("platform_subscription_payments")
      .select(PAYMENT_FIELDS)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  /**
   * Fetch one payment by ID.
   */
  async getSubscriptionPaymentById(paymentId) {
    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    const { data, error } = await supabase
      .from("platform_subscription_payments")
      .select(PAYMENT_FIELDS)
      .eq("id", paymentId)
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Get a temporary signed URL for payment screenshot.
   * URL expires after 5 minutes.
   */
  async getPaymentProofUrl(storagePath) {
    if (!storagePath) {
      throw new Error("Payment proof is not available.");
    }

    const { data, error } = await supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(storagePath, 300);

    if (error) throw error;

    return data.signedUrl;
  },

  /**
   * Approve a pending payment.
   *
   * Database RPC handles payment verification,
   * subscription activation and renewal creation.
   */
  async approvePayment(paymentId, notes = "") {
    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    const { data, error } = await supabase.rpc(
      "admin_approve_subscription_payment",
      {
        p_payment_id: paymentId,
        p_notes: String(notes || "").trim() || null,
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error("Payment approval could not be verified.");
    }

    return data;
  },

  /**
   * Reject a pending payment.
   * Rejection reason is mandatory.
   */
  async rejectPayment(paymentId, reason) {
    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    const cleanReason = String(reason || "").trim();

    if (!cleanReason) {
      throw new Error("Please provide a rejection reason.");
    }

    const { data, error } = await supabase.rpc(
      "admin_reject_subscription_payment",
      {
        p_payment_id: paymentId,
        p_reason: cleanReason,
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error("Payment rejection could not be verified.");
    }

    return data;
  },

  /**
   * Get payment statistics for admin dashboard.
   */
  async getPaymentStats() {
    const [pending, successful, rejected, refunded] =
      await Promise.all([
        this.getSubscriptionPayments({ status: "pending" }),
        this.getSubscriptionPayments({ status: "successful" }),
        this.getSubscriptionPayments({ status: "rejected" }),
        this.getSubscriptionPayments({ status: "refunded" }),
      ]);

    const totalRevenue = successful.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    return {
      pendingCount: pending.length,
      successfulCount: successful.length,
      rejectedCount: rejected.length,
      refundedCount: refunded.length,
      totalRevenue,
      pendingAmount: pending.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      ),
    };
  },
};

export default adminSubscriptionService;
