
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  RefreshCw,
  Package,
  CalendarDays,
  IndianRupee,
  Truck,
  X,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import deliveryService from "../../../../deliveries/services/deliveryService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const emptyItem = (product, plan) => ({
  productId: product.id,
  productName: product.name,
  quantity: Number(plan?.default_quantity || 0),
  returned: 0,
  unitPrice: Number(plan?.unit_price ?? product.sale_price ?? 0),
  isReturnableJar: Boolean(product.is_returnable_jar),
});

export default function CustomerDeliverySection({
  customer,
  deliveries = [],
  loading = false,
  error = "",
  onRefresh,
  isArchived = false,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState(today());
  const [shift, setShift] = useState("morning");
  const [notes, setNotes] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const records = useMemo(
    () =>
      [...(Array.isArray(deliveries) ? deliveries : [])].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      ),
    [deliveries]
  );

  const totalDelivered = records.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0
  );

  const totalReturned = records.reduce(
    (sum, record) => sum + Number(record.jarsReceived || 0),
    0
  );

  const totalValue = records.reduce(
    (sum, record) => sum + Number(record.amount || 0),
    0
  );

  const loadProducts = async (date) => {
    setProductsLoading(true);
    setFormError("");

    try {
      const [productRows, ratePlans] = await Promise.all([
        deliveryService.getProducts(),
        deliveryService.getCustomerRatePlans(customer.id, date),
      ]);

      setProducts(productRows || []);

      const planByProduct = new Map(
        (ratePlans || []).map((plan) => [plan.product_id, plan])
      );

      return { productRows: productRows || [], planByProduct };
    } catch (err) {
      setFormError(err?.message || "Unable to load customer products.");
      return { productRows: [], planByProduct: new Map() };
    } finally {
      setProductsLoading(false);
    }
  };

  const openCreate = async () => {
    if (isArchived) return;

    setEditingDelivery(null);
    setDeliveryDate(today());
    setShift("morning");
    setNotes("");
    setItems([]);
    setFormError("");
    setModalOpen(true);

    const { productRows, planByProduct } = await loadProducts(today());

    setItems(
      productRows
        .filter((product) => planByProduct.has(product.id))
        .map((product) => emptyItem(product, planByProduct.get(product.id)))
    );
  };

  const openEdit = async (delivery) => {
    if (isArchived) return;

    setEditingDelivery(delivery);
    setDeliveryDate(delivery.date);
    setShift(delivery.shift || "morning");
    setNotes(delivery.notes || "");
    setItems([]);
    setFormError("");
    setModalOpen(true);

    const { productRows, planByProduct } = await loadProducts(delivery.date);

    const savedItems = delivery.items || [];
    const savedByProduct = new Map(
      savedItems.map((item) => [item.productId, item])
    );

    const assignedProducts = productRows.filter((product) =>
      planByProduct.has(product.id) || savedByProduct.has(product.id)
    );

    setItems(
      assignedProducts.map((product) => {
        const saved = savedByProduct.get(product.id);
        const plan = planByProduct.get(product.id);

        return {
          productId: product.id,
          productName: product.name,
          quantity: Number(saved?.quantity ?? 0),
          returned: Number(saved?.returned ?? 0),
          unitPrice: Number(
            saved?.unitPrice ?? plan?.unit_price ?? product.sale_price ?? 0
          ),
          isReturnableJar: Boolean(product.is_returnable_jar),
        };
      })
    );
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingDelivery(null);
    setFormError("");
  };

  const updateItem = (productId, field, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;

        const numericValue = Number(value);
        return {
          ...item,
          [field]: Number.isFinite(numericValue)
            ? Math.max(0, numericValue)
            : 0,
        };
      })
    );
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!customer?.id || saving || isArchived) return;

    setSaving(true);
    setFormError("");

    try {
      const payloadItems = items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity || 0),
        returned: Number(item.returned || 0),
        unitPrice: Number(item.unitPrice || 0),
      }));

      for (const item of payloadItems) {
        if (item.returned > item.quantity) {
          throw new Error(
            `Received quantity cannot exceed delivered quantity for ${
              items.find((row) => row.productId === item.productId)
                ?.productName || "a product"
            }.`
          );
        }
      }

      if (!payloadItems.some((item) => item.quantity > 0 || item.returned > 0)) {
        throw new Error("Enter at least one product quantity.");
      }

      await deliveryService.saveBulkDeliveryDay({
        customerId: customer.id,
        date: deliveryDate,
        shift,
        items: payloadItems,
        notes,
      });

      setModalOpen(false);
      setEditingDelivery(null);

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setFormError(err?.message || "Unable to save delivery.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!modalOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) closeModal();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalOpen, saving]);

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Delivery History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            All delivery records for {customer?.name || "this customer"}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}

          <button
            type="button"
            onClick={openCreate}
            disabled={isArchived}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Create Delivery
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Delivered"
          value={totalDelivered}
          icon={<Package size={19} />}
        />
        <SummaryCard
          label="Returned"
          value={totalReturned}
          icon={<Truck size={19} />}
        />
        <SummaryCard
          label="Delivery Value"
          value={currency(totalValue)}
          icon={<IndianRupee size={19} />}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
          <LoaderCircle className="animate-spin" size={20} />
          Loading delivery records...
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <Package size={30} className="mx-auto text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-900">
            No delivery records yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create the first delivery for this customer.
          </p>
          {!isArchived && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} className="mr-1 inline" />
              Create Delivery
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((delivery) => {
            const deliveryItems = delivery.items || [];

            return (
              <article
                key={delivery.id}
                className="overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-teal-600 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <CalendarDays size={18} className="text-teal-700" />
                      {formatDate(delivery.date)}
                    </div>
                    <p className="mt-1 text-sm capitalize text-slate-500">
                      {delivery.shift || "Regular"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                      Saved Delivery
                    </span>

                    <button
                      type="button"
                      onClick={() => openEdit(delivery)}
                      disabled={isArchived}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {deliveryItems.length ? (
                    deliveryItems.map((item) => (
                      <div
                        key={item.id || item.productId}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.productName || item.product?.name || "Product"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Delivered: {item.quantity} · Received: {item.returned}
                            {" · "}Rate: {currency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {currency(item.lineTotal ?? item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      {delivery.quantity || 0} delivered ·{" "}
                      {delivery.jarsReceived || 0} returned
                    </p>
                  )}

                  <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 text-sm">
                    <span className="text-slate-500">
                      {delivery.notes || "No additional notes"}
                    </span>
                    <span className="font-bold text-slate-900">
                      Total: {currency(delivery.amount)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5">
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDelivery ? "Edit Delivery" : "Create Delivery"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {customer?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
                {formError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {formError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Delivery Date
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      disabled={Boolean(editingDelivery)}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 disabled:bg-slate-100"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Shift
                    <select
                      value={shift}
                      disabled={Boolean(editingDelivery)}
                      onChange={(event) => setShift(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 capitalize disabled:bg-slate-100"
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>

                {editingDelivery && (
                  <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    Date and shift are locked while editing because the current
                    database save function identifies a delivery by customer,
                    date and shift.
                  </p>
                )}

                {productsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                    <LoaderCircle size={20} className="animate-spin" />
                    Loading assigned products...
                  </div>
                ) : items.length === 0 ? (
                  <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                    No products are assigned to this customer for this date.
                    Assign products and rates first.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">
                      Products
                    </h4>

                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {item.productName}
                          </p>
                          <span className="text-sm text-slate-500">
                            {currency(item.unitPrice)} / unit
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <NumberField
                            label="Delivered"
                            value={item.quantity}
                            onChange={(value) =>
                              updateItem(item.productId, "quantity", value)
                            }
                          />
                          <NumberField
                            label="Received"
                            value={item.returned}
                            onChange={(value) =>
                              updateItem(item.productId, "returned", value)
                            }
                          />
                          <NumberField
                            label="Rate (₹)"
                            value={item.unitPrice}
                            step="0.01"
                            onChange={(value) =>
                              updateItem(item.productId, "unitPrice", value)
                            }
                          />
                        </div>

                        <div className="mt-3 text-right text-sm font-semibold text-slate-800">
                          Amount: {currency(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <label className="block text-sm font-medium text-slate-700">
                  Notes
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                    placeholder="Optional delivery notes"
                  />
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || productsLoading || items.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingDelivery
                      ? "Update Delivery"
                      : "Save Delivery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NumberField({ label, value, onChange, step = "1" }) {
  return (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500"
      />
    </label>
  );
}
