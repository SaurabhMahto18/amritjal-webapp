import { supabase } from "../../../lib/supabase/client";

export async function getWalletTransactions() {
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Please login again.");

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (businessError) throw businessError;

  // Default table name. Confirm against your Supabase schema.
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((item) => {
    const amount = Number(
      item.amount ?? item.transaction_amount ?? item.total_amount ?? 0
    );

    const rawType = String(
      item.transaction_type ??
      item.type ??
      item.transaction_key ??
      item.direction ??
      ""
    ).toLowerCase();

    const isMoneyIn = [
      "in", "credit", "money_in", "income", "deposit", "received"
    ].some((value) => rawType.includes(value));

    const isMoneyOut = [
      "out", "debit", "money_out", "expense", "withdrawal", "paid"
    ].some((value) => rawType.includes(value));

    const date =
      item.transaction_date ??
      item.date ??
      item.created_at ??
      null;

    return {
      id: item.id,
      amount,
      date,
      type: isMoneyIn ? "in" : isMoneyOut ? "out" : "unknown",
      title: item.title ?? item.transaction_name ?? (
        isMoneyIn ? "Money Received" :
        isMoneyOut ? "Money Paid" : "Wallet Transaction"
      ),
      description:
        item.description ??
        item.note ??
        item.remarks ??
        item.reference ??
        "",
      key:
        item.transaction_key ??
        item.reference ??
        item.id,
      raw: item,
    };
  });
}
