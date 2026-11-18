import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets, LoaderCircle, RefreshCw } from "lucide-react";

import deliveryService from "../services/deliveryService";
import DeliveryForm from "../components/DeliveryForm";

export default function DeliveryCreatePage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    setError("");

    try {
      const result = await deliveryService.getCustomers();
      setCustomers(result || []);
    } catch (err) {
      setError(err?.message || "Unable to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSubmit = async (formData) => {
    if (saving) return;

    setError("");
    setSaving(true);

    try {
      const customerId = formData.customer_id;
      const date = formData.delivery_date;
      const quantity = Number(formData.jar_quantity);
      const rate = Number(formData.jar_rate);
      const notes = formData.notes || "";

      if (!customerId) {
        setError("Please select a customer.");
        return;
      }

      if (!date) {
        setError("Please select a delivery date.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        setError("Enter a whole jar quantity greater than zero.");
        return;
      }

      if (!Number.isFinite(rate) || rate < 0) {
        setError("Enter a valid rate per jar.");
        return;
      }

      await deliveryService.create({
        customerId,
        date,
        quantity,
        rate,
        notes,
      });

      navigate("/deliveries", {
        state: { success: "Delivery saved successfully." },
      });
    } catch (err) {
      setError(err?.message || "Unable to save delivery.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-800">
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        {/* Compact navigation and page heading */}
        <div className="mb-3 flex items-center gap-2 sm:mb-6">
          <button
            type="button"
            onClick={() => navigate("/deliveries")}
            aria-label="Back to deliveries"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-cyan-800 sm:size-10"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 sm:size-12 sm:rounded-2xl">
              <Droplets size={22} className="sm:hidden" />
              <Droplets size={26} className="hidden sm:block" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                Create Delivery
              </h1>
              <p className="truncate text-xs text-slate-500 sm:mt-1 sm:text-sm">
                Record a customer's water jar delivery
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 sm:mb-5 sm:px-4 sm:py-3 sm:text-sm"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 font-semibold text-red-800"
            >
              ×
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
          {/* Shorter card header on phones; expanded helper text on larger screens */}
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-cyan-50/70 px-3 py-3 sm:px-6 sm:py-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-800 sm:hidden">
              <Droplets size={17} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Delivery Details
              </h2>
              <p className="hidden text-sm text-slate-500 sm:mt-1 sm:block">
                Complete the required fields to record this delivery.
              </p>
              <p className="text-[11px] text-slate-500 sm:hidden">
                Enter customer and delivery information
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {loadingCustomers ? (
              <div
                role="status"
                className="flex min-h-32 items-center justify-center gap-2.5 py-8 text-sm text-slate-500 sm:min-h-48"
              >
                <LoaderCircle
                  size={20}
                  className="animate-spin text-cyan-700"
                />
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="space-y-3 py-2 sm:space-y-4">
                <p className="text-xs leading-relaxed text-amber-700 sm:text-sm">
                  No active customers are available. Add a customer before
                  creating a delivery.
                </p>

                <button
                  type="button"
                  onClick={loadCustomers}
                  disabled={loadingCustomers}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
                >
                  <RefreshCw size={15} />
                  Retry Loading Customers
                </button>
              </div>
            ) : (
              <div className="delivery-form-responsive">
                <DeliveryForm
                  customers={customers}
                  onSubmit={handleSubmit}
                  onCancel={() => navigate("/deliveries")}
                  submitLabel={saving ? "Saving Delivery..." : "Save Delivery"}
                />
              </div>
            )}
          </div>
        </section>

        <p className="mt-3 px-1 text-center text-[10px] text-slate-400 sm:mt-4 sm:text-xs">
          Please verify the delivery details before saving.
        </p>
      </div>

      {/* Scoped responsive refinements for common native controls rendered by DeliveryForm.
          These do not change form state, validation, or submission behavior. */}
      <style>{`
        .delivery-form-responsive {
          min-width: 0;
        }
        .delivery-form-responsive input,
        .delivery-form-responsive select,
        .delivery-form-responsive textarea {
          max-width: 100%;
        }
        .delivery-form-responsive button {
          touch-action: manipulation;
        }
        @media (max-width: 639px) {
          .delivery-form-responsive {
            font-size: 13px;
          }
          .delivery-form-responsive input,
          .delivery-form-responsive select,
          .delivery-form-responsive textarea {
            min-height: 40px;
            font-size: 14px;
          }
          .delivery-form-responsive textarea {
            min-height: 76px;
          }
          .delivery-form-responsive button {
            min-height: 40px;
          }
        }
      `}</style>
    </main>
  );
}
