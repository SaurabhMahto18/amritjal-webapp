
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets, LoaderCircle } from "lucide-react";

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
      setCustomers(result);
    } catch (err) {
      setError(err.message || "Unable to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSubmit = async (formData) => {
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
      setError(err.message || "Unable to save delivery.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/deliveries")}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-cyan-800"
        >
          <ArrowLeft size={18} />
          Back to Deliveries
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-800">
            <Droplets size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create Delivery
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Record a customer's water jar delivery.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-4 sm:px-6">
            <h2 className="font-semibold">Delivery Details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields marked as required must be completed.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            {loadingCustomers ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                <LoaderCircle
                  size={22}
                  className="animate-spin text-cyan-700"
                />
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-700">
                  No active customers are available. Add a customer before
                  creating a delivery.
                </p>

                <button
                  type="button"
                  onClick={loadCustomers}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Retry Loading Customers
                </button>
              </div>
            ) : (
              <DeliveryForm
                customers={customers}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/deliveries")}
                submitLabel={saving ? "Saving Delivery..." : "Save Delivery"}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
