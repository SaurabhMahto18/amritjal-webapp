
import { supabase } from "../../../lib/supabase/client";

export const businessAccessService = {
  // ========================================
  // GET CURRENT USER BUSINESS ACCESS
  // ========================================

  async getCurrentBusinessAccess() {
    // Verify authenticated user first.
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!authData?.user) {
      throw new Error(
        "Please sign in to continue."
      );
    }

    // Fetch business access using secure Supabase RPC.
    const {
      data,
      error,
    } = await supabase.rpc(
      "get_my_business_access"
    );

    if (error) {
      throw error;
    }

    // Handle both array and object responses.
    const business = Array.isArray(data)
      ? data[0]
      : data;

    if (!business?.business_id) {
      throw new Error(
        "No active business membership was found for this account."
      );
    }

    return {
      businessId: business.business_id,
      businessName: business.business_name,
      role: business.member_role,

      isSuspended: Boolean(
        business.is_suspended
      ),

      suspensionReason:
        business.suspension_reason || "",

      suspendedAt:
        business.suspended_at || null,
    };
  },
};

// ========================================
// GET CURRENT BUSINESS ID
// ========================================

export async function getCurrentBusinessId() {
  const access =
    await businessAccessService.getCurrentBusinessAccess();

  if (access.isSuspended) {
    throw new Error(
      "This business account is suspended. Access is restricted."
    );
  }

  return access.businessId;
}
