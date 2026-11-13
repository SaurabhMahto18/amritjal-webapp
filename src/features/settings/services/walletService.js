
import { supabase } from "../../../lib/supabase/client";

async function getOwnerBusiness() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Please log in to access your wallet.");

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, owner_id, owner_wallet_balance")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("No business profile found for your account.");
  }

  return data;
}

export async function getOwnerWallet() {
  const business = await getOwnerBusiness();

  return {
    businessId: business.id,
    businessName: business.name,
    balance: Number(business.owner_wallet_balance),
  };
}

export async function getOwnerWalletTransactions() {
  const business = await getOwnerBusiness();

  const { data, error } = await supabase
    .from("business_wallet_transactions")
    .select(
      "id, transaction_type, amount, balance_before, balance_after, note, created_at"
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function adjustOwnerWallet(targetBalance, note = "") {
  const amount = Number(targetBalance);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Enter a valid non-negative wallet balance.");
  }

  if (Math.round(amount * 100) !== amount * 100) {
    throw new Error("Only two decimal places are allowed.");
  }

  const { data, error } = await supabase.rpc(
    "adjust_business_owner_wallet",
    {
      p_target_balance: amount,
      p_note: note.trim() || null,
    }
  );

  if (error) throw error;

  return data;
}
