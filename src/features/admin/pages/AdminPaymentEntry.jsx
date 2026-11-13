
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminPaymentEntryService } from "../services/adminPaymentEntryService";

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const initialForm = {
  businessId: "",
  planId: "",
  amount: "",
  paymentMethod: "upi",
  paymentDate: getTodayDate(),
  referenceNo: "",
  billingCycle: "monthly",
  notes: "",
};

export default function AdminPaymentEntry() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [businesses, setBusinesses] = useState([]);
  const [plans, setPlans] = useState([]);

  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        setLoading(true);

        const data = await adminPaymentEntryService.getFormOptions();

        if (!mounted) return;

        setBusinesses(data.businesses);
        setPlans(data.plans);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load payment form.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPlan = plans.find(
    (plan) => plan.id === form.planId
  );

  const selectedPrice = selectedPlan
    ? form.billingCycle === "yearly"
      ? selectedPlan.price_yearly
      : selectedPlan.price_monthly
    : null;

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  function handleBusinessChange(businessId) {
    setForm((previous) => ({
      ...previous,
      businessId,
    }));

    setCurrentSubscription(null);
    setResult(null);
    setError("");

    if (!businessId) return;

    setCheckingSubscription(true);

    adminPaymentEntryService
      .getBusinessSubscription(businessId)
      .then((data) => {
        setCurrentSubscription(data);
      })
      .catch((err) => {
        setError(
          err.message || "Unable to load current subscription."
        );
      })
      .finally(() => {
        setCheckingSubscription(false);
      });
  }

  function handlePlanChange(planId) {
    const plan = plans.find((item) => item.id === planId);

    const price = plan
      ? form.billingCycle === "yearly"
        ? plan.price_yearly
        : plan.price_monthly
      : "";

    setForm((previous) => ({
      ...previous,
      planId,
      amount: price ?? "",
    }));

    setResult(null);
    setError("");
  }

  function handleBillingCycleChange(billingCycle) {
    const price = selectedPlan
      ? billingCycle === "yearly"
        ? selectedPlan.price_yearly
        : selectedPlan.price_monthly
      : "";

    setForm((previous) => ({
      ...previous,
      billingCycle,
      amount: price ?? "",
    }));

    setResult(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedPlan || selectedPrice === null || selectedPrice === undefined) {
      setError("Please select a plan with configured pricing.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setResult(null);

      const response =
        await adminPaymentEntryService.createManualPayment(form);

      setResult(response);

      // Refresh subscription preview
      if (form.businessId && response.status === "active") {
        const updatedSubscription =
          await adminPaymentEntryService.getBusinessSubscription(
            form.businessId
          );

        setCurrentSubscription(updatedSubscription);
      }
    } catch (err) {
      setError(err.message || "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading payment form...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/revenue")}
          className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Revenue
        </button>

        <h1 className="text-2xl font-bold text-slate-900">
          Record Manual Payment
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Verify the received payment and activate or schedule
          the business subscription.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-800">
            Payment recorded successfully
          </h2>

          <p className="mt-2 text-sm text-emerald-700">
            {result.status === "active"
              ? "The subscription has been activated."
              : "The payment is recorded and the renewal is queued for the scheduled start date."}
          </p>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-emerald-700">Payment ID</span>
              <p className="break-all font-medium text-emerald-900">
                {result.payment_id}
              </p>
            </div>

            <div>
              <span className="text-emerald-700">Renewal status</span>
              <p className="font-semibold capitalize text-emerald-900">
                {result.status}
              </p>
            </div>

            <div>
              <span className="text-emerald-700">Scheduled start</span>
              <p className="font-medium text-emerald-900">
                {formatDate(result.scheduled_start_at)}
              </p>
            </div>

            <div>
              <span className="text-emerald-700">Scheduled expiry</span>
              <p className="font-medium text-emerald-900">
                {formatDate(result.scheduled_end_at)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/revenue")}
            className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            View Revenue
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Business and Subscription */}

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Business & Subscription
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Business *
              </label>

              <select
                required
                value={form.businessId}
                onChange={(e) =>
                  handleBusinessChange(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="">Choose business</option>

                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Subscription Plan *
              </label>

              <select
                required
                value={form.planId}
                onChange={(e) =>
                  handlePlanChange(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="">Choose plan</option>

                {plans.map((plan) => {
                  const price =
                    form.billingCycle === "yearly"
                      ? plan.price_yearly
                      : plan.price_monthly;

                  const unavailable =
                    price === null || price === undefined ||
                    Number(price) <= 0;

                  return (
                    <option
                      key={plan.id}
                      value={plan.id}
                      disabled={unavailable}
                    >
                      {plan.name} —{" "}
                      {plan.max_customers
                        ? `${plan.max_customers} customers`
                        : "Custom"}
                      {unavailable ? " (Not available for paid entry)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {checkingSubscription && (
            <p className="mt-3 text-sm text-slate-500">
              Checking current subscription...
            </p>
          )}

          {currentSubscription && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-800">
                Current Subscription
              </h3>

              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  Plan:{" "}
                  <strong>
                    {currentSubscription.subscription_plans?.name || "Unknown"}
                  </strong>
                </p>

                <p>
                  Status:{" "}
                  <strong className="capitalize">
                    {currentSubscription.status}
                  </strong>
                </p>

                <p>
                  Billing:{" "}
                  <strong className="capitalize">
                    {currentSubscription.billing_cycle}
                  </strong>
                </p>

                <p>
                  Current expiry:{" "}
                  <strong>
                    {formatDate(currentSubscription.ends_at)}
                  </strong>
                </p>
              </div>
            </div>
          )}

          {form.planId && selectedPlan && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Selected plan:{" "}
              <strong>{selectedPlan.name}</strong>
              {selectedPlan.max_customers
                ? ` · ${selectedPlan.max_customers} customers`
                : ""}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* Payment Information */}

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Payment Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Amount (₹) *
              </label>

              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                readOnly
                placeholder="Select a plan first"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm"
              />

              <p className="mt-1 text-xs text-slate-500">
                Amount is automatically determined by the selected plan.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment Method *
              </label>

              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  updateField("paymentMethod", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment Date *
              </label>

              <input
                required
                type="date"
                max={getTodayDate()}
                value={form.paymentDate}
                onChange={(e) =>
                  updateField("paymentDate", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Transaction Reference
              </label>

              <input
                value={form.referenceNo}
                onChange={(e) =>
                  updateField("referenceNo", e.target.value)
                }
                placeholder="UPI Ref / UTR / Receipt No."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Billing Cycle */}

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Billing Period
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Billing Cycle *
              </label>

              <select
                value={form.billingCycle}
                onChange={(e) =>
                  handleBillingCycleChange(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly (2 months free)</option>
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Subscription price</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {selectedPrice !== null && selectedPrice !== undefined
                  ? formatPrice(selectedPrice)
                  : "Select plan"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {form.billingCycle === "yearly"
                  ? "12 months of access at the discounted yearly price."
                  : "1 month of subscription access."}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Admin Notes
          </label>

          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Payment verification details..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        {/* Verification notice */}

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Payment verification</strong>
          <p className="mt-1">
            Submit only after confirming that the payment has
            actually been received. The database will verify the
            selected plan price before recording the transaction.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/revenue")}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              !form.businessId ||
              !form.planId ||
              !selectedPlan ||
              selectedPrice === null ||
              selectedPrice === undefined ||
              checkingSubscription
            }
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving Payment..." : "Verify & Record Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
