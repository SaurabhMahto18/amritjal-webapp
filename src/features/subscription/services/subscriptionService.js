import { supabase } from "../../../lib/supabase";

export const PROOF_BUCKET = "subscription-payment-proofs";

const PLAN_FIELDS = `
  id,
  code,
  name,
  description,
  max_customers,
  is_custom,
  is_active,
  price_monthly,
  price_yearly
`;

// ========================================
// GET ACTIVE BUSINESS
// ========================================

export async function getActiveBusiness() {
  const { data, error } = await supabase.rpc(
    "get_my_business_access"
  );

  if (error) {
    throw new Error(
      `Unable to load business details: ${error.message}`
    );
  }

  const value = Array.isArray(data) ? data[0] : data;

  const businessId =
    value?.business_id ||
    value?.id ||
    value?.business?.id;

  if (!businessId) {
    throw new Error(
      "No active business was found for this account."
    );
  }

  return {
    ...value,
    business_id: businessId,
  };
}

// ========================================
// GET ACTIVE SUBSCRIPTION PLANS
// ========================================

export async function getActivePlans() {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select(PLAN_FIELDS)
    .eq("is_active", true)
    .order("price_monthly", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(
      `Unable to fetch subscription plans: ${error.message}`
    );
  }

  return data || [];
}

// ========================================
// GET PLAN BY CODE
// ========================================

export async function getPlanByCode(code) {
  if (!code) {
    throw new Error("Subscription plan code is required.");
  }

  const { data, error } = await supabase
    .from("subscription_plans")
    .select(PLAN_FIELDS)
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load selected plan: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("Selected subscription plan is unavailable.");
  }

  return data;
}

// ========================================
// CREATE PAYMENT REQUEST
// ========================================

export async function submitPayment({
  planId,
  billingCycle,
  paymentMethod,
  referenceNo,
}) {
  if (!planId) {
    throw new Error("Please select a subscription plan.");
  }

  if (!["monthly", "yearly"].includes(billingCycle)) {
    throw new Error("Invalid billing cycle.");
  }

  if (!["upi", "bank_transfer"].includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
  }

  if (!referenceNo?.trim()) {
    throw new Error("Transaction reference is required.");
  }

  const { data, error } = await supabase.rpc(
    "submit_business_subscription_payment",
    {
      p_plan_id: planId,
      p_billing_cycle: billingCycle,
      p_payment_method: paymentMethod,
      p_reference_no: referenceNo.trim(),
    }
  );

  if (error) {
    throw new Error(
      `Payment request failed: ${error.message}`
    );
  }

  // Normalize common JSON response structures.
  const paymentId =
    data?.payment_id ||
    data?.id ||
    data?.payment?.id;

  if (!paymentId) {
    throw new Error(
      "Payment request response did not contain a payment ID. Check payment history before retrying."
    );
  }

  return {
    ...(
      data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {}
    ),
    payment_id: paymentId,
  };
}

// ========================================
// UPLOAD PAYMENT SCREENSHOT
// ========================================

export async function attachPaymentProof(paymentId, file) {
  if (!paymentId) {
    throw new Error("Payment ID is required.");
  }

  if (!file) {
    throw new Error("Please select a payment screenshot.");
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Screenshot must be 5 MB or smaller.");
  }

  const business = await getActiveBusiness();

  const allowedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
  ];

  const extension =
    file.name.split(".").pop()?.toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    throw new Error(
      "Allowed formats: JPG, JPEG, PNG and WEBP."
    );
  }

  const path =
    `${business.business_id}/${paymentId}/proof-${Date.now()}.${extension}`;

  // Upload to private bucket
  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(
      `Screenshot upload failed: ${uploadError.message}`
    );
  }

  // Attach uploaded proof to payment record
  const { error: attachError } = await supabase.rpc(
    "attach_subscription_payment_proof",
    {
      p_payment_id: paymentId,
      p_storage_path: path,
    }
  );

  if (attachError) {
    throw new Error(
      `Screenshot uploaded but could not be attached: ${attachError.message}. Please contact support before submitting another payment.`
    );
  }

  return path;
}

// ========================================
// GET MY PAYMENT HISTORY
// ========================================

export async function getMyPayments() {
  const { data, error } = await supabase.rpc(
    "get_my_subscription_payments"
  );

  if (error) {
    throw new Error(
      `Unable to load payment history: ${error.message}`
    );
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.payments)) {
    return data.payments;
  }

  return [];
}

// ========================================
// GET CURRENT SUBSCRIPTION
// ========================================

export async function getMySubscription() {
  const business = await getActiveBusiness();

  const { data, error } = await supabase
    .from("business_subscriptions")
    .select(`
      id,
      business_id,
      plan_id,
      status,
      billing_cycle,
      starts_at,
      ends_at,
      trial_ends_at,
      custom_customer_limit,
      active_customer_count,
      is_complimentary,
      full_access_override,
      access_expires_at,
      subscription_plans (
        id,
        code,
        name,
        description,
        max_customers,
        is_custom,
        price_monthly,
        price_yearly
      )
    `)
    .eq("business_id", business.business_id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load current subscription: ${error.message}`
    );
  }

  return data;
}

// ========================================
// GET PAYMENT BY ID
// ========================================

export async function getPaymentById(paymentId) {
  if (!paymentId) return null;

  const payments = await getMyPayments();

  return (
    payments.find(
      (payment) => payment.id === paymentId
    ) || null
  );
}

// ========================================
// GET PAYMENT PROOF SIGNED URL
// ========================================

export async function getProofUrl(storagePath) {
  if (!storagePath) return null;

  const { data, error } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(storagePath, 300);

  if (error) {
    throw new Error(
      `Unable to open payment screenshot: ${error.message}`
    );
  }

  return data?.signedUrl || null;
}