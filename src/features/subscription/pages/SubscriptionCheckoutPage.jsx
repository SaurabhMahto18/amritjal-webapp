import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  getPlanByCode,
  submitPayment,
} from "../services/subscriptionService";

import {
  Field,
  inputClass,
  money,
  Notice,
  PageShell,
  Panel,
  PrimaryButton,
} from "./subscriptionUi";

export default function SubscriptionCheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const code = params.get("plan") || "";

  const initialCycle =
    params.get("cycle") === "yearly"
      ? "yearly"
      : "monthly";

  const [plan, setPlan] = useState(null);
  const [cycle, setCycle] = useState(initialCycle);
  const [method, setMethod] = useState("upi");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load selected plan
  useEffect(() => {
    let active = true;

    if (!code) {
      setError("No subscription plan was selected.");
      setLoading(false);
      return;
    }

    getPlanByCode(code)
      .then((value) => {
        if (active) setPlan(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [code]);

  const amount =
    cycle === "yearly"
      ? plan?.price_yearly
      : plan?.price_monthly;

  // Continue to payment submission
  const handleContinue = async (event) => {
    event.preventDefault();

    if (!plan) {
      setError("Please select a valid subscription plan.");
      return;
    }

    if (!reference.trim()) {
      setError("Please enter your transaction reference.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await submitPayment({
        planId: plan.id,
        billingCycle: cycle,
        paymentMethod: method,
        referenceNo: reference.trim(),
      });

      const paymentId =
        result?.payment_id ||
        result?.id ||
        result?.payment?.id;

      if (!paymentId) {
        throw new Error(
          "Payment request was created, but no payment ID was returned. Check payment history before trying again."
        );
      }

      navigate(
        `/subscription/payment-submission?paymentId=${encodeURIComponent(
          paymentId
        )}`
      );
    } catch (e) {
      setError(
        e.message || "Unable to create payment request."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Complete your subscription"
      subtitle="Confirm your plan and payment details. Your subscription will remain inactive until the payment is reviewed and approved."
    >
      {loading ? (
        <Panel>
          <p className="text-sm text-[#686961]">
            Loading selected plan...
          </p>
        </Panel>
      ) : !plan ? (
        <Panel>
          <Notice type="error">
            {error || "Selected plan could not be loaded."}
          </Notice>

          <Link
            to="/subscriptions"
            className="mt-5 inline-block text-sm font-semibold text-[#796516] underline"
          >
            Back to subscription plans
          </Link>
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">

          {/* PAYMENT DETAILS */}
          <Panel>
            <h2 className="text-lg font-bold">
              Payment details
            </h2>

            <form
              onSubmit={handleContinue}
              className="mt-6 space-y-5"
            >

              {/* BILLING CYCLE */}
              <Field label="Billing cycle">
                <div className="grid grid-cols-2 gap-3">
                  {["monthly", "yearly"].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setCycle(value)}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold capitalize transition ${
                        cycle === value
                          ? "border-[#E9CA43] bg-[#E9CA43]/15 text-[#24262B]"
                          : "border-[#E5E2D8] bg-white text-[#686961]"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </Field>

              {/* PAYMENT METHOD */}
              <Field label="Payment method">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["upi", "UPI"],
                    ["bank_transfer", "Bank Transfer"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setMethod(value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        method === value
                          ? "border-[#E9CA43] bg-[#E9CA43]/10"
                          : "border-[#E5E2D8] bg-white"
                      }`}
                    >
                      <span className="text-sm font-bold">
                        {label}
                      </span>

                      <span className="mt-1 block text-xs text-[#77766F]">
                        {value === "upi"
                          ? "Pay using your UPI app"
                          : "NEFT / IMPS / bank transfer"}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              {/* TRANSACTION REFERENCE */}
              <Field
                label="UTR / Transaction reference"
                hint="Enter the transaction reference from your payment confirmation."
              >
                <input
                  className={inputClass}
                  value={reference}
                  onChange={(e) =>
                    setReference(e.target.value)
                  }
                  required
                  maxLength={120}
                  placeholder="Enter UTR or transaction ID"
                />
              </Field>

              {error && (
                <Notice type="error">
                  {error}
                </Notice>
              )}

              <PrimaryButton
                type="submit"
                disabled={saving || !reference.trim()}
                className="w-full"
              >
                {saving
                  ? "Creating payment request..."
                  : "Continue to payment proof"}
              </PrimaryButton>

            </form>
          </Panel>

          {/* ORDER SUMMARY */}
          <Panel className="h-fit">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#8A7620]">
              Order summary
            </p>

            <h2 className="mt-3 text-2xl font-extrabold">
              {plan.name}
            </h2>

            <p className="mt-2 text-sm text-[#686961]">
              {plan.description}
            </p>

            <div className="my-6 border-t border-[#EDEAE0]" />

            <div className="flex justify-between text-sm">
              <span className="text-[#686961]">
                Billing
              </span>

              <span className="font-semibold capitalize">
                {cycle}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-[#686961]">
                Customer limit
              </span>

              <span className="font-semibold">
                {plan.max_customers || "Custom"}
              </span>
            </div>

            <div className="my-6 border-t border-[#EDEAE0]" />

            <div className="flex items-end justify-between">
              <span className="font-semibold">
                Total due
              </span>

              <span className="text-3xl font-extrabold">
                {money(amount)}
              </span>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#85857D]">
              Payment verification is manual. Do not submit
              another payment request while one is pending.
            </p>

            <Link
              to="/subscription"
              className="mt-5 inline-block text-sm font-semibold text-[#746015] underline"
            >
              Back to plans
            </Link>
          </Panel>

        </div>
      )}
    </PageShell>
  );
}