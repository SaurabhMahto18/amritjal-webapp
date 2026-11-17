
import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  CalendarDays,
  X,
  LoaderCircle,
  AlertCircle,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import deliveryService from "../../../../deliveries/services/deliveryService";
import { customerService } from "../../../services/customerService";

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
  createDeliveryDate = "",
  onCreateDeliveryHandled,
  editDeliveryDate = "",
  onEditDeliveryHandled,
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

  const openCreate = async (selectedDate = today()) => {
    if (isArchived) return;

    const targetDate = selectedDate || today();

    setEditingDelivery(null);
    setDeliveryDate(targetDate);
    setShift("morning");
    setNotes("");
    setItems([]);
    setFormError("");
    setModalOpen(true);
    setProductsLoading(true);

    try {
      // Use the same assignment source as the Customer Products section.
      const assignedProducts =
        await customerService.getAssignedProducts(customer.id);

      const activeAssignments = (assignedProducts || []).filter(
        (assignment) =>
          assignment.productStatus === "active" &&
          assignment.productId
      );

      // Keep a normalized product list in state for consistency with Edit.
      setProducts(
        activeAssignments.map((assignment) => ({
          id: assignment.productId,
          name: assignment.productName,
          sale_price: Number(assignment.salePrice || 0),
          is_returnable_jar: Boolean(assignment.isReturnableJar),
        }))
      );

      setItems(
        activeAssignments.map((assignment) => ({
          productId: assignment.productId,
          productName: assignment.productName,
          quantity: Number(assignment.defaultQuantity || 0),
          returned: 0,
          unitPrice: Number(
            assignment.unitPrice ?? assignment.salePrice ?? 0
          ),
          isReturnableJar: Boolean(assignment.isReturnableJar),
        }))
      );

      if (activeAssignments.length === 0) {
        setFormError(
          "No active products are assigned to this customer. Check Customer Products."
        );
      }
    } catch (err) {
      setProducts([]);
      setItems([]);
      setFormError(
        err?.message || "Unable to load assigned customer products."
      );
    } finally {
      setProductsLoading(false);
    }
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

  const resetQuantities = () => {
    setItems((current) =>
      current.map((item) => ({ ...item, quantity: 0, returned: 0 }))
    );
  };

  const adjustItem = (productId, field, amount) => {
    setItems((current) =>
      current.map((item) => {
        if (item.productId !== productId) return item;
        const nextValue = Math.max(0, Number(item[field] || 0) + amount);
        return { ...item, [field]: nextValue };
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
    if (!createDeliveryDate || isArchived) return;
    openCreate(createDeliveryDate);
    onCreateDeliveryHandled?.();
    // A new request is issued by the parent for each selected day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createDeliveryDate]);

  useEffect(() => {
    if (!editDeliveryDate || isArchived) return;

    const matchingDelivery = (deliveries || []).find(
      (delivery) =>
        String(delivery.date || "").slice(0, 10) ===
        String(editDeliveryDate).slice(0, 10)
    );

    if (matchingDelivery) {
      openEdit(matchingDelivery);
      onEditDeliveryHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editDeliveryDate, deliveries]);

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

      </header>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
          <LoaderCircle className="animate-spin" size={20} />
          Loading delivery records...
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <CalendarDays size={30} className="mx-auto text-slate-400" />
          <h3 className="mt-3 font-semibold text-slate-900">
            No delivery records yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create the first delivery for this customer.
          </p>

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-2 sm:p-5">
          <div className="flex max-h-[94dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-[28px]">
            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-7 sm:pt-7">
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
                  {customer?.name || "Customer"}
                </h3>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {editingDelivery ? "Edit transaction" : `Create transaction for ${formatDate(deliveryDate)}.`}
                </p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close">
                <X size={25} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 sm:space-y-5 sm:px-6">
                <div className="grid grid-cols-1 gap-2 rounded-2xl border border-cyan-600/70 p-2 sm:grid-cols-2 sm:gap-3">
                  <label className="flex min-w-0 items-center gap-2 px-2 py-1.5 text-sm font-semibold text-cyan-700">
                    <CalendarDays size={21} className="shrink-0" />
                    <input type="date" required value={deliveryDate}
                      disabled={Boolean(editingDelivery)}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-cyan-700 outline-none disabled:opacity-70" />
                  </label>
                  <label className="flex min-w-0 items-center gap-2 border-t border-slate-100 px-2 py-1.5 text-sm font-semibold text-cyan-700 sm:border-l sm:border-t-0 sm:pl-4">
                    <select value={shift} disabled={Boolean(editingDelivery)}
                      onChange={(event) => setShift(event.target.value)}
                      className="min-w-0 flex-1 appearance-none bg-transparent py-1 text-sm font-semibold capitalize text-cyan-700 outline-none disabled:opacity-70">
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown size={18} className="shrink-0" />
                  </label>
                </div>

                <p className="px-2 text-sm text-slate-800">
                  {editingDelivery ? "Update transaction" : "Create transaction"} for <strong>{formatDate(deliveryDate)}</strong>.
                </p>

                {editingDelivery && (
                  <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    Date and shift are locked while editing because the current database save function identifies a delivery by customer, date and shift.
                  </p>
                )}

                {formError && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {productsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                    <LoaderCircle size={20} className="animate-spin" />
                    Loading assigned products...
                  </div>
                ) : items.length === 0 ? (
                  <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    No products are assigned to this customer. Assign products and rates first.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {[
                      { title: "Assigned products", rows: items.filter((item) => item.isReturnableJar) },
                      { title: "Other products", rows: items.filter((item) => !item.isReturnableJar) },
                    ].filter((group) => group.rows.length > 0).map((group, groupIndex) => (
                      <ProductGroup key={group.title} title={group.title} items={group.rows}
                        updateItem={updateItem} adjustItem={adjustItem} defaultOpen={groupIndex === 0} />
                    ))}
                  </div>
                )}

                <label className="block px-1 text-sm font-medium text-slate-700">
                  Notes
                  <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-600"
                    placeholder="Optional delivery notes" />
                </label>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-1.5 border-t border-slate-200 bg-white p-3 sm:gap-2 sm:px-6 sm:py-4">
                <button type="button" onClick={resetQuantities}
                  disabled={saving || productsLoading || items.length === 0}
                  className="min-h-12 border-2 border-cyan-600 bg-white px-3 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-50 sm:text-base">
                  Reset
                </button>
                <button type="submit" disabled={saving || productsLoading || items.length === 0}
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-cyan-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:bg-slate-300 sm:text-base">
                  {saving && <LoaderCircle size={17} className="animate-spin" />}
                  {saving ? "Submitting..." : editingDelivery ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function ProductGroup({ title, items, updateItem, adjustItem, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="space-y-3">
      <button type="button" onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-2 py-1 text-left text-base font-semibold text-slate-900"
        aria-expanded={open}>
        {title}
        {open ? <ChevronUp size={21} className="text-cyan-600" /> : <ChevronDown size={21} className="text-cyan-600" />}
      </button>
      {open && (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.productId} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="break-words text-sm font-bold text-slate-900 sm:text-base">{item.productName}</h4>
                  <p className="mt-1 text-xs text-slate-500">Rate: {currency(item.unitPrice)} / unit</p>
                </div>
                <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">
                  {currency(item.quantity * item.unitPrice)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <QuantityStepper label="Delivered" value={item.quantity}
                  onDecrease={() => adjustItem(item.productId, "quantity", -1)}
                  onIncrease={() => adjustItem(item.productId, "quantity", 1)}
                  onChange={(value) => updateItem(item.productId, "quantity", value)} />
                <QuantityStepper label="Received" value={item.returned}
                  onDecrease={() => adjustItem(item.productId, "returned", -1)}
                  onIncrease={() => adjustItem(item.productId, "returned", 1)}
                  onChange={(value) => updateItem(item.productId, "returned", value)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function QuantityStepper({ label, value, onDecrease, onIncrease, onChange }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_38px_54px_38px] items-center gap-1.5">
      <span className="text-xs font-medium text-slate-700 sm:text-sm">{label}</span>
      <button type="button" onClick={onDecrease} aria-label={`Decrease ${label}`}
        className="flex h-10 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">
        <Minus size={19} />
      </button>
      <input type="number" min="0" step="1" value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border-2 border-slate-300 text-center text-base text-slate-900 outline-none focus:border-cyan-600" />
      <button type="button" onClick={onIncrease} aria-label={`Increase ${label}`}
        className="flex h-10 items-center justify-center rounded-lg bg-cyan-600 text-white hover:bg-cyan-700">
        <Plus size={19} />
      </button>
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
