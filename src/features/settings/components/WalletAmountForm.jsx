
import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Save, Wallet, AlertCircle, CheckCircle2 } from "lucide-react";

import {
  getOwnerWallet,
  adjustOwnerWallet,
} from "../services/walletService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function WalletAmountForm() {
  const [balance, setBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("0");
  const [remark, setRemark] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const wallet = await getOwnerWallet();

      setBalance(wallet.balance);
      setWalletAmount(String(wallet.balance));
    } catch (err) {
      setError(err.message || "Unable to load wallet balance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleAmountChange = (event) => {
    const value = event.target.value;

    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setWalletAmount(value);
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const targetBalance = Number(walletAmount);

    if (walletAmount.trim() === "" || !Number.isFinite(targetBalance)) {
      setError("Please enter a valid wallet amount.");
      return;
    }

    if (targetBalance < 0) {
      setError("Wallet amount cannot be negative.");
      return;
    }

    if (Math.round(targetBalance * 100) !== targetBalance * 100) {
      setError("Only two decimal places are allowed.");
      return;
    }

    if (targetBalance === balance) {
      setSuccess("Wallet balance is already up to date.");
      setError("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await adjustOwnerWallet(
        targetBalance,
        remark
      );

      setBalance(Number(result.new_balance));
      setWalletAmount(String(result.new_balance));
      setRemark("");

      if (result.transaction_type === "credit") {
        setSuccess(
          `Wallet credited by ${currency(result.adjustment_amount)}. New balance: ${currency(result.new_balance)}.`
        );
      } else if (result.transaction_type === "debit") {
        setSuccess(
          `Wallet debited by ${currency(result.adjustment_amount)}. New balance: ${currency(result.new_balance)}.`
        );
      } else {
        setSuccess("Wallet balance is already up to date.");
      }
    } catch (err) {
      setError(err.message || "Unable to update wallet balance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-[525px] rounded-2xl border border-[#DCE8EA] bg-white p-6 shadow-[0_3px_12px_rgba(16,45,58,0.04)] sm:p-10">

      {/* Heading */}
      <div className="border-b border-[#DCE8EA] pb-5">
        <h2 className="text-xl font-bold text-[#102D3A]">
          Adjustment Wallet
        </h2>

        <p className="mt-1 text-sm text-[#8299A5]">
          Adjust your agency owner's wallet balance.
        </p>
      </div>

      {/* Current Balance */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
          <Wallet size={20} />
        </div>

        <div>
          <p className="text-xs text-[#8299A5]">
            Current Wallet Balance
          </p>

          <p className="text-lg font-bold text-[#102D3A]">
            {loading ? "Loading..." : currency(balance)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-7 space-y-6">

        <div className="max-w-xl">
          <label
            htmlFor="walletAmount"
            className="mb-2 block text-sm font-medium text-[#506875]"
          >
            Wallet Amount
            <span className="ml-1 text-red-500">*</span>
          </label>

          <input
            id="walletAmount"
            type="text"
            inputMode="decimal"
            value={walletAmount}
            onChange={handleAmountChange}
            disabled={loading || saving}
            placeholder="Enter wallet amount"
            className="w-full rounded-lg border border-[#DCE8EA] bg-white px-3.5 py-3 text-sm text-[#102D3A] outline-none transition placeholder:text-[#A3B3BA] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
          />
        </div>

        <div className="max-w-xl">
          <label
            htmlFor="walletRemark"
            className="mb-2 block text-sm font-medium text-[#506875]"
          >
            Remark
          </label>

          <input
            id="walletRemark"
            type="text"
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
            disabled={loading || saving}
            maxLength={250}
            placeholder=""
            className="w-full rounded-lg border border-[#DCE8EA] bg-white px-3.5 py-3 text-sm text-[#102D3A] outline-none transition placeholder:text-[#A3B3BA] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
          />
        </div>

        {error && (
          <div className="flex max-w-xl items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex max-w-xl items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Update Button */}
        <div className="flex max-w-xl justify-end border-t border-[#DCE8EA] pt-5">
          <button
            type="submit"
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087F8C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#066A75] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Updating..." : "Update Wallet"}
          </button>
        </div>

      </form>
    </section>
  );
}
