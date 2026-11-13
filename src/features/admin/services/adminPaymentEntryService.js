
import { supabase } from "../../../lib/supabase/client";

export const adminPaymentEntryService = {
  async getFormOptions() {
    const [businessResult, planResult] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name")
        .order("name"),

      supabase
        .from("subscription_plans")
        .select(
          "id, name, code, max_customers, price_monthly, price_yearly"
        )
        .eq("is_active", true)
        .order("max_customers", { ascending: true }),
    ]);

    if (businessResult.error) throw businessResult.error;
    if (planResult.error) throw planResult.error;

    return {
      businesses: businessResult.data || [],
      plans: planResult.data || [],
    };
  },

  async getBusinessSubscription(businessId) {
    if (!businessId) return null;

    const { data, error } = await supabase
      .from("business_subscriptions")
      .select(`
        id,
        status,
        billing_cycle,
        starts_at,
        ends_at,
        subscription_plans (
          name,
          max_customers
        )
      `)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async createManualPayment(form) {
    const {
      businessId,
      planId,
      amount,
      paymentMethod,
      paymentDate,
      referenceNo,
      billingCycle,
      notes,
    } = form;

    if (!businessId || !planId) {
      throw new Error("Please select a business and subscription plan.");
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      throw new Error("Invalid billing cycle.");
    }

    if (!["cash", "upi", "bank_transfer", "other"].includes(paymentMethod)) {
      throw new Error("Invalid payment method.");
    }

    if (
      amount === "" ||
      amount === null ||
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    ) {
      throw new Error("Invalid payment amount.");
    }

    if (!paymentDate) {
      throw new Error("Please select the payment date.");
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError) throw authError;

    if (!authData?.user) {
      throw new Error("Please sign in again.");
    }

    const { data, error } = await supabase.rpc(
      "admin_record_subscription_payment",
      {
        p_business_id: businessId,
        p_plan_id: planId,
        p_billing_cycle: billingCycle,
        p_amount: Number(amount),
        p_payment_method: paymentMethod,
        p_payment_date: paymentDate,
        p_reference_no: referenceNo?.trim() || null,
        p_notes: notes?.trim() || null,
      }
    );

    if (error) {
      throw new Error(error.message || "Payment recording failed.");
    }

    if (!data?.success) {
      throw new Error("Payment could not be recorded.");
    }

    return data;
  },
};
