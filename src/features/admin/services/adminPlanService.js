
import { supabase } from "../../../lib/supabase";

const PLAN_FIELDS =
  "id, code, name, max_customers, price_monthly, price_yearly, is_custom, is_active";

function normalizePlan(payload) {
  const isCustom = Boolean(payload.is_custom);

  const name = String(payload.name || "").trim();
  const code = String(payload.code || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!name) {
    throw new Error("Plan name is required.");
  }

  if (!code) {
    throw new Error("Plan code is required.");
  }

  const maxCustomers =
    isCustom || payload.max_customers === ""
      ? null
      : Number(payload.max_customers);

  const monthlyPrice =
    isCustom || payload.price_monthly === ""
      ? null
      : Number(payload.price_monthly);

  const yearlyPrice =
    isCustom || payload.price_yearly === ""
      ? null
      : Number(payload.price_yearly);

  if (!isCustom) {
    if (
      !Number.isInteger(maxCustomers) ||
      maxCustomers < 1
    ) {
      throw new Error(
        "Customer limit must be a positive whole number."
      );
    }

    if (
      monthlyPrice === null ||
      yearlyPrice === null ||
      !Number.isFinite(monthlyPrice) ||
      !Number.isFinite(yearlyPrice) ||
      monthlyPrice < 0 ||
      yearlyPrice < 0
    ) {
      throw new Error("Enter valid non-negative plan prices.");
    }
  }

  return {
    code,
    name,
    max_customers: maxCustomers,
    price_monthly: monthlyPrice,
    price_yearly: yearlyPrice,
    is_custom: isCustom,
    is_active: Boolean(payload.is_active),
  };
}

export const adminPlanService = {
  // Fetch all plans
  async getPlans() {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select(PLAN_FIELDS)
      .order("max_customers", {
        ascending: true,
        nullsFirst: false,
      })
      .order("name", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  // Create or update a plan
  async savePlan(payload, planId = null) {
    const cleanPayload = normalizePlan(payload);

    if (planId) {
      // Keep existing plan code immutable.
      const { code, ...updatePayload } = cleanPayload;

      const { data, error } = await supabase
        .from("subscription_plans")
        .update(updatePayload)
        .eq("id", planId)
        .select(PLAN_FIELDS)
        .single();

      if (error) throw error;

      if (!data || data.id !== planId) {
        throw new Error("Plan update could not be verified.");
      }

      return data;
    }

    // Create new plan
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert(cleanPayload)
      .select(PLAN_FIELDS)
      .single();

    if (error) throw error;

    if (!data?.id) {
      throw new Error("Plan creation could not be verified.");
    }

    return data;
  },

  // Activate or deactivate a plan
  async setPlanStatus(planId, isActive) {
    if (!planId) {
      throw new Error("Plan ID is required.");
    }

    if (typeof isActive !== "boolean") {
      throw new Error("Invalid plan status.");
    }

    const { data, error } = await supabase
      .from("subscription_plans")
      .update({ is_active: isActive })
      .eq("id", planId)
      .select(PLAN_FIELDS)
      .single();

    if (error) throw error;

    if (
      !data ||
      data.id !== planId ||
      data.is_active !== isActive
    ) {
      throw new Error(
        "Plan status update could not be verified."
      );
    }

    return data;
  },
};
