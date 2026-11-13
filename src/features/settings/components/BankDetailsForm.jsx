
import { useEffect, useState } from "react";
import {
  CreditCard,
  Save,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

const INITIAL_FORM = {
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifsc: "",
  branch: "",
  accountType: "Current",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-[#DCE8EA] bg-white px-3.5 py-3 text-sm text-[#102D3A] outline-none transition placeholder:text-[#A3B3BA] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10";

function FormField({ label, required = false, children }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-sm font-medium text-[#506875]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function BankDetailsForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [businessId, setBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showConfirmNumber, setShowConfirmNumber] = useState(false);

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  // Load existing bank details
  useEffect(() => {
    let cancelled = false;

    async function loadBankDetails() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          throw new Error("Please sign in to continue.");
        }

        const { data: business, error: businessError } =
          await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();

        if (businessError) throw businessError;

        if (!business) {
          if (!cancelled) {
            setBusinessId(null);
            setStatus({
              type: "info",
              message:
                "Create your Agency Profile first. Bank details need a business record.",
            });
          }
          return;
        }

        const { data: settings, error: settingsError } =
          await supabase
            .from("business_invoice_settings")
            .select(
              "id, bank_account_name, bank_name, bank_account_number, bank_ifsc"
            )
            .eq("business_id", business.id)
            .maybeSingle();

        if (settingsError) throw settingsError;
        if (cancelled) return;

        setBusinessId(business.id);

        setForm({
          ...INITIAL_FORM,
          accountHolder: settings?.bank_account_name ?? "",
          bankName: settings?.bank_name ?? "",
          accountNumber: settings?.bank_account_number ?? "",
          confirmAccountNumber:
            settings?.bank_account_number ?? "",
          ifsc: settings?.bank_ifsc ?? "",
        });
      } catch (error) {
        if (!cancelled) {
          setStatus({
            type: "error",
            message:
              error.message || "Unable to load bank details.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBankDetails();

    return () => {
      cancelled = true;
    };
  }, []);

  // Update field values
  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setStatus({
      type: "",
      message: "",
    });
  }

  // Validate form
  function validate() {
    const nextErrors = {};

    if (!form.accountHolder.trim()) {
      nextErrors.accountHolder =
        "Account holder name is required.";
    }

    if (!form.bankName.trim()) {
      nextErrors.bankName = "Bank name is required.";
    }

    const accountNumber = form.accountNumber.trim();
    const confirmation = form.confirmAccountNumber.trim();

    if (!/^[0-9]{6,30}$/.test(accountNumber)) {
      nextErrors.accountNumber =
        "Enter an account number containing 6–30 digits.";
    }

    if (accountNumber !== confirmation) {
      nextErrors.confirmAccountNumber =
        "Account numbers do not match.";
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.ifsc.trim())) {
      nextErrors.ifsc =
        "Enter a valid 11-character IFSC code.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  // Save bank details
  async function handleSave(event) {
    event.preventDefault();

    if (!validate()) {
      setStatus({
        type: "error",
        message: "Please correct the highlighted fields.",
      });
      return;
    }

    setSaving(true);
    setStatus({
      type: "",
      message: "",
    });

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error(
          "Your session has expired. Sign in again."
        );
      }

      // Resolve business again before saving
      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!business) {
        throw new Error(
          "Please create your Agency Profile first."
        );
      }

      const currentBusinessId = business.id;

      const payload = {
        business_id: currentBusinessId,
        bank_account_name: form.accountHolder.trim(),
        bank_name: form.bankName.trim(),
        bank_account_number: form.accountNumber.trim(),
        bank_ifsc: form.ifsc.trim().toUpperCase(),
      };

      const { data: existing, error: readError } =
        await supabase
          .from("business_invoice_settings")
          .select("id")
          .eq("business_id", currentBusinessId)
          .maybeSingle();

      if (readError) throw readError;

      if (existing) {
        const { error } = await supabase
          .from("business_invoice_settings")
          .update({
            bank_account_name: payload.bank_account_name,
            bank_name: payload.bank_name,
            bank_account_number: payload.bank_account_number,
            bank_ifsc: payload.bank_ifsc,
          })
          .eq("business_id", currentBusinessId);

        if (error) throw error;
      } else {
        // Preserve existing initial billing settings defaults
        const { error } = await supabase
          .from("business_invoice_settings")
          .insert({
            ...payload,
            capsule_jar_charge: 200,
            thermal_jar_charge: 600,
            dispenser_jar_charge: 150,
          });

        if (error) throw error;
      }

      setBusinessId(currentBusinessId);

      setForm((current) => ({
        ...current,
        ifsc: current.ifsc.trim().toUpperCase(),
      }));

      setStatus({
        type: "success",
        message: "Bank details saved successfully.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.message || "Unable to save bank details.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-2xl border border-[#DCE8EA] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-[#506875]">
          <LoaderCircle
            size={20}
            className="animate-spin text-[#087F8C]"
          />
          Loading bank details...
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <section className="rounded-2xl border border-[#DCE8EA] bg-white p-6 shadow-[0_3px_12px_rgba(16,45,58,0.04)] sm:p-10">

        {/* Heading */}
        <div className="flex items-center gap-3 border-b border-[#DCE8EA] pb-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
            <CreditCard size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#102D3A]">
              Bank Details
            </h2>

            <p className="mt-1 text-sm text-[#8299A5]">
              Manage the bank information displayed on invoices.
            </p>
          </div>
        </div>

        {/* Security Information */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#CBE9E5] bg-[#EFF9F7] p-4">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-[#087F8C]"
          />

          <div>
            <p className="text-sm font-semibold text-[#102D3A]">
              Business payment information
            </p>

            <p className="mt-1 text-xs leading-5 text-[#607D87]">
              Only authorized business owners should manage these
              details. Verify your bank information before using
              it on customer invoices.
            </p>
          </div>
        </div>

        {/* Bank Fields */}
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* Account Holder */}
          <FormField label="Account holder name" required>
            <input
              value={form.accountHolder}
              onChange={(event) =>
                updateField("accountHolder", event.target.value)
              }
              placeholder="Name registered with the bank"
              className={INPUT_CLASS}
              autoComplete="off"
            />

            {errors.accountHolder && (
              <p className="text-xs text-red-600">
                {errors.accountHolder}
              </p>
            )}
          </FormField>

          {/* Bank Name */}
          <FormField label="Bank name" required>
            <input
              value={form.bankName}
              onChange={(event) =>
                updateField("bankName", event.target.value)
              }
              placeholder="Enter bank name"
              className={INPUT_CLASS}
              autoComplete="off"
            />

            {errors.bankName && (
              <p className="text-xs text-red-600">
                {errors.bankName}
              </p>
            )}
          </FormField>

          {/* Account Number */}
          <FormField label="Account number" required>
            <div className="relative">
              <input
                type={showAccountNumber ? "text" : "password"}
                inputMode="numeric"
                value={form.accountNumber}
                onChange={(event) =>
                  updateField(
                    "accountNumber",
                    event.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="Enter account number"
                className={`${INPUT_CLASS} pr-12`}
                autoComplete="off"
              />

              <button
                type="button"
                onClick={() =>
                  setShowAccountNumber((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#8299A5] hover:bg-[#EFF4F5] hover:text-[#087F8C]"
                aria-label={
                  showAccountNumber
                    ? "Hide account number"
                    : "Show account number"
                }
              >
                {showAccountNumber ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.accountNumber && (
              <p className="text-xs text-red-600">
                {errors.accountNumber}
              </p>
            )}
          </FormField>

          {/* Confirm Account Number */}
          <FormField label="Confirm account number" required>
            <div className="relative">
              <input
                type={showConfirmNumber ? "text" : "password"}
                inputMode="numeric"
                value={form.confirmAccountNumber}
                onChange={(event) =>
                  updateField(
                    "confirmAccountNumber",
                    event.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="Re-enter account number"
                className={`${INPUT_CLASS} pr-12`}
                autoComplete="off"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmNumber((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#8299A5] hover:bg-[#EFF4F5] hover:text-[#087F8C]"
                aria-label={
                  showConfirmNumber
                    ? "Hide confirmation"
                    : "Show confirmation"
                }
              >
                {showConfirmNumber ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {errors.confirmAccountNumber && (
              <p className="text-xs text-red-600">
                {errors.confirmAccountNumber}
              </p>
            )}
          </FormField>

          {/* IFSC */}
          <FormField label="IFSC code" required>
            <input
              value={form.ifsc}
              onChange={(event) =>
                updateField("ifsc", event.target.value.toUpperCase())
              }
              placeholder="e.g. SBIN0001234"
              maxLength={11}
              className={INPUT_CLASS}
              autoComplete="off"
            />

            {errors.ifsc && (
              <p className="text-xs text-red-600">
                {errors.ifsc}
              </p>
            )}
          </FormField>

          
        </div>

        {/* Status */}
        {status.message && (
          <div
            role="status"
            className={`mt-6 flex items-start gap-2 rounded-xl border p-3 text-sm ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : status.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[#CBE9E5] bg-[#EFF9F7] text-[#17636A]"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
            )}

            <span>{status.message}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-7 flex justify-end border-t border-[#DCE8EA] pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#087F8C] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066A75] focus:outline-none focus:ring-4 focus:ring-[#087F8C]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save Bank Details"}
          </button>
        </div>
      </section>
    </form>
  );
}
