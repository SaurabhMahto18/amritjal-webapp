
import { supabase } from "../../../lib/supabase";

export async function getBusinessAccessStatus(businessId) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  const { data, error } = await supabase
    .from("business_access_controls")
    .select(`
      business_id,
      is_suspended,
      suspension_reason,
      suspended_at,
      suspended_by,
      updated_at
    `)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) throw error;

  return (
    data || {
      business_id: businessId,
      is_suspended: false,
      suspension_reason: null,
      suspended_at: null,
      suspended_by: null,
    }
  );
}

export async function suspendBusiness(businessId, reason) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error("Please enter a valid suspension reason.");
  }

  const { data, error } = await supabase.rpc("suspend_business", {
    p_business_id: businessId,
    p_reason: reason.trim(),
  });

  if (error) throw error;

  if (data !== true) {
    throw new Error("Business suspension could not be confirmed.");
  }

  return getBusinessAccessStatus(businessId);
}

export async function reactivateBusiness(businessId) {
  if (!businessId) {
    throw new Error("Business ID is required.");
  }

  const { data, error } = await supabase.rpc("reactivate_business", {
    p_business_id: businessId,
  });

  if (error) throw error;

  if (data !== true) {
    throw new Error("Business reactivation could not be confirmed.");
  }

  return getBusinessAccessStatus(businessId);
}
