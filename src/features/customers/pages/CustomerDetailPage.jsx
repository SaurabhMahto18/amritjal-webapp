import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  UserRound,
  Phone,
  MapPin,
  Droplets,
  Wallet,
  CalendarDays,
  FileText,
  Truck,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  Package,
  Trash2,
  Save,
  X,
  ChevronRight,
} from "lucide-react";


import { supabase } from "../../../lib/supabase";
import { getInvoices } from "../../invoices/services/invoiceService";

import { useCustomers } from "../hooks/useCustomers";
import { customerService } from "../services/customerService";
import deliveryService from "../../deliveries/services/deliveryService";

import CustomerDetailLayout from "../components/customer-details/layout/CustomerDetailLayout";
import CustomerDetailContent from "../components/customer-details/layout/CustomerDetailContent";
import CustomerDetailHeader from "../components/customer-details/header/CustomerDetailHeader";

// Details sidebar sections
import OpeningAmountSection from "../components/customer-details/sections/OpeningAmountSection";
import OpeningDeliverySection from "../components/customer-details/sections/OpeningDeliverySection";
import SecurityDepositSection from "../components/customer-details/sections/SecurityDepositSection";
import InvoicePreferenceSection from "../components/customer-details/sections/InvoicePreferenceSection";
import MessageSettingsSection from "../components/customer-details/sections/MessageSettingsSection";
import CustomerRestrictionsSection from "../components/customer-details/sections/CustomerRestrictionsSection";
import UnbalancedProductsSection from "../components/customer-details/sections/UnbalancedProductsSection";
import CustomerQRSection from "../components/customer-details/sections/CustomerQRSection";

// Horizontal customer tabs
import CustomerPaymentsSection from "../components/customer-details/tabs/CustomerPaymentsSection";
import CustomerInvoicesSection from "../components/customer-details/tabs/CustomerInvoicesSection";
import CustomerMonthlyCardSection from "../components/customer-details/tabs/CustomerMonthlyCardSection";
import CustomerDeliverySection from "../components/customer-details/tabs/CustomerDeliverySection";
import CustomerLedgerSection from "../components/customer-details/tabs/CustomerLedgerSection";
import CustomerLeavesSection from "../components/customer-details/tabs/CustomerLeavesSection";
import CustomerUnbalancedProductsSection from "../components/customer-details/tabs/CustomerUnbalancedProductsSection";






/* ----------------------------------
   Helpers
---------------------------------- */

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <RefreshCw
          size={30}
          className="mx-auto animate-spin text-teal-700"
        />
        <h2 className="mt-4 font-bold text-slate-900">
          Loading Customer
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Please wait while customer details are retrieved.
        </p>
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle size={26} />
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Unable to Load Customer
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <Link
            to="/customers"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Customers
          </Link>
        </div>
      </div>
    </main>
  );
}

function ProductField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ----------------------------------
   Customer Products
   Existing service integration
---------------------------------- */

function CustomerProducts({
  customerId,
  isArchived,
  customerServiceApi,
}) {
  const [assignments, setAssignments] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [defaultQuantity, setDefaultQuantity] = useState("1");

  const [editingId, setEditingId] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("1");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [assigned, products] = await Promise.all([
        customerServiceApi.getAssignedProducts(customerId),
        customerServiceApi.getAvailableProducts(),
      ]);

      setAssignments(assigned || []);
      setAvailableProducts(products || []);
    } catch (err) {
      setError(err?.message || "Unable to load customer products.");
    } finally {
      setLoading(false);
    }
  }, [customerId, customerServiceApi]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const assignedProductIds = new Set(
    assignments.map((item) => item.productId)
  );

  const unassignedProducts = availableProducts.filter(
    (product) => !assignedProductIds.has(product.id)
  );

  function handleProductChange(productId) {
    setSelectedProductId(productId);

    const product = availableProducts.find(
      (item) => item.id === productId
    );

    setUnitPrice(product ? String(product.salePrice ?? 0) : "");
  }

  function resetForm() {
    setShowForm(false);
    setSelectedProductId("");
    setUnitPrice("");
    setDefaultQuantity("1");
  }

  async function handleAssignProduct(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (
      unitPrice === "" ||
      !Number.isFinite(Number(unitPrice)) ||
      Number(unitPrice) < 0
    ) {
      setError("Please enter a valid product rate.");
      return;
    }

    if (
      defaultQuantity === "" ||
      !Number.isFinite(Number(defaultQuantity)) ||
      Number(defaultQuantity) < 0
    ) {
      setError("Please enter a valid default quantity.");
      return;
    }

    setSaving(true);

    try {
      await customerServiceApi.assignProduct(
        customerId,
        selectedProductId,
        Number(unitPrice),
        Number(defaultQuantity)
      );

      resetForm();
      await loadProducts();
      setSuccess("Product assigned successfully.");
    } catch (err) {
      setError(err?.message || "Unable to assign product.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(item) {
    setEditingId(item.id);
    setEditingPrice(String(item.unitPrice));
    setEditingQuantity(String(item.defaultQuantity));
    setError("");
    setSuccess("");
  }

  async function handleUpdateAssignment(event) {
    event.preventDefault();

    if (
      editingPrice === "" ||
      !Number.isFinite(Number(editingPrice)) ||
      Number(editingPrice) < 0
    ) {
      setError("Please enter a valid product rate.");
      return;
    }

    if (
      editingQuantity === "" ||
      !Number.isFinite(Number(editingQuantity)) ||
      Number(editingQuantity) < 0
    ) {
      setError("Please enter a valid default quantity.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await customerServiceApi.updateProductAssignment(
        editingId,
        Number(editingPrice),
        Number(editingQuantity)
      );

      setEditingId("");
      await loadProducts();
      setSuccess("Product assignment updated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to update product assignment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(item) {
    const confirmed = window.confirm(
      `Remove ${item.productName} from this customer's active product list?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await customerServiceApi.deactivateProductAssignment(item.id);
      await loadProducts();
      setSuccess(`${item.productName} assignment deactivated.`);
    } catch (err) {
      setError(err?.message || "Unable to deactivate assignment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-8 text-sm text-slate-500">
        <RefreshCw size={18} className="animate-spin" />
        Loading assigned products...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Assigned Products
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer-specific products, rates and quantities.
          </p>
        </div>

        {!isArchived && (
          <button
            type="button"
            onClick={() => {
              setShowForm((value) => !value);
              setError("");
              setSuccess("");
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Close" : "Assign Product"}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          {success}
        </div>
      )}

      {showForm && !isArchived && (
        <form
          onSubmit={handleAssignProduct}
          className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 sm:p-6"
        >
          <h3 className="mb-4 font-bold text-slate-900">
            Assign New Product
          </h3>

          {unassignedProducts.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500">
              All active products are already assigned to this customer.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ProductField label="Select Product">
                  <select
                    value={selectedProductId}
                    onChange={(event) =>
                      handleProductChange(event.target.value)
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Choose product</option>
                    {unassignedProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.unit ? ` (${product.unit})` : ""}
                      </option>
                    ))}
                  </select>
                </ProductField>

                <ProductField label="Customer Rate (₹)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(event.target.value)}
                    className={inputClass}
                    required
                  />
                </ProductField>

                <ProductField label="Default Quantity">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaultQuantity}
                    onChange={(event) =>
                      setDefaultQuantity(event.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </ProductField>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || !selectedProductId}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : "Save Assignment"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
          <Package size={28} className="mx-auto text-teal-700" />
          <h3 className="mt-4 font-bold text-slate-900">
            No Products Assigned
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Assign a product to this customer to manage delivery rates and
            default quantities.
          </p>
          {!isArchived && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} />
              Assign First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {assignments.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              {editingId === item.id ? (
                <form
                  onSubmit={handleUpdateAssignment}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-slate-900">
                    Edit {item.productName}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <ProductField label="Rate (₹)">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingPrice}
                        onChange={(event) =>
                          setEditingPrice(event.target.value)
                        }
                        className={inputClass}
                        required
                      />
                    </ProductField>

                    <ProductField label="Default Quantity">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editingQuantity}
                        onChange={(event) =>
                          setEditingQuantity(event.target.value)
                        }
                        className={inputClass}
                        required
                      />
                    </ProductField>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Save size={15} />
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingId("")}
                      disabled={saving}
                      className="min-h-10 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Package size={23} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words font-bold text-slate-900">
                          {item.productName}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.sku || item.unit || "Assigned product"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Customer Rate</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {money(item.unitPrice)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Default Quantity
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {item.defaultQuantity}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-400">
                      From {formatDate(item.effectiveFrom)}
                    </p>

                    {!isArchived && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          disabled={saving}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeactivate(item)}
                          disabled={saving}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                          Deactivate
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
        <p className="text-xs leading-5 text-blue-800">
          Product assignment controls which products are available for this
          customer's deliveries. Changing an assignment does not rewrite
          historical delivery records.
        </p>
      </div>
    </div>
  );
}


/* ----------------------------------
   Customer Detail Page
---------------------------------- */

export default function CustomerDetailPage() {
  const { customerId } = useParams();
  const { getCustomerById } = useCustomers();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState("Profile");
  const [activeTab, setActiveTab] = useState("overview");
  const [retryKey, setRetryKey] = useState(0);
  const [assignedProducts, setAssignedProducts] = useState([]);

  // SEO metadata for this authenticated customer page.
  // Keep private customer records out of search engine indexes.
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );
    const robotsMeta = document.querySelector('meta[name="robots"]');

    const previousDescription = descriptionMeta?.content;
    const previousRobots = robotsMeta?.content;

    const description = descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    description.name = "description";
    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        description.content = previousDescription || "";
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robots.content = previousRobots || "";
      } else {
        robots.remove();
      }
    };
  }, []);

  useEffect(() => {
    const name =
      typeof customer?.name === "string" && customer.name.trim()
        ? customer.name.trim()
        : "Customer";

    document.title = `${name} | Customer Profile | Amrit Jal`;

    const description = document.querySelector(
      'meta[name="description"]'
    );

    if (description) {
      const details = [
        customer?.phone ? `Phone: ${customer.phone}` : "",
        customer?.area ? `Area: ${customer.area}` : "",
      ].filter(Boolean);

      description.content = details.length
        ? `Manage ${name}'s customer profile, delivery history, payments, invoices and account details in Amrit Jal. ${details.join(". ")}.`
        : `Manage ${name}'s customer profile, delivery history, payments, invoices and account details in Amrit Jal.`;
    }
  }, [customer]);

  // Customer delivery history
  const [customerDeliveries, setCustomerDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveriesError, setDeliveriesError] = useState("");

  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");

  // Load invoices belonging to this customer.
  const loadCustomerInvoices = useCallback(async () => {
    if (!customer?.id) {
      setCustomerInvoices([]);
      setInvoicesError("");
      setInvoicesLoading(false);
      return;
    }

    setInvoicesLoading(true);
    setInvoicesError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        throw new Error("Please log in to view customer invoices.");
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (!business?.id) {
        throw new Error("Business account was not found.");
      }

      const allInvoices = await getInvoices(business.id);

      const normalizedInvoices = (Array.isArray(allInvoices) ? allInvoices : [])
        .filter(
          (invoice) =>
            String(invoice.customer_id) === String(customer.id)
        )
        .map((invoice) => ({
          ...invoice,
          invoiceNumber: invoice.invoice_number,
          invoiceDate: invoice.invoice_date,
          startDate: invoice.period_start,
          endDate: invoice.period_end,
          totalAmount: Number(invoice.total_amount || 0),
          amountToPay: Number(invoice.total_amount || 0),
          paidAmount: Number(invoice.amount_paid || 0),
          additionalCharges: Number(invoice.subtotal || 0),
          discount: Number(invoice.discount_amount || 0),
          status: invoice.status,
        }));

      setCustomerInvoices(normalizedInvoices);
    } catch (error) {
      console.error("Unable to load customer invoices:", error);
      setInvoicesError(
        error?.message || "Unable to load customer invoices."
      );
      setCustomerInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, [customer?.id]);

  useEffect(() => {
    void loadCustomerInvoices();
  }, [loadCustomerInvoices]);

  // Load assigned products
  useEffect(() => {
    let active = true;

    async function loadAssignedProducts() {
      if (!customer?.id) {
        setAssignedProducts([]);
        return;
      }

      try {
        const result = await customerService.getAssignedProducts(customer.id);
        if (active) setAssignedProducts(result || []);
      } catch (error) {
        console.error("Unable to load assigned products:", error);
        if (active) setAssignedProducts([]);
      }
    }

    void loadAssignedProducts();

    return () => {
      active = false;
    };
  }, [customer?.id]);


  const loadCustomerDeliveries = useCallback(async () => {
    if (!customer?.id) {
      setCustomerDeliveries([]);
      return;
    }

    setDeliveriesLoading(true);
    setDeliveriesError("");

    try {
      const [records, products] = await Promise.all([
        deliveryService.getAll({ customerId: customer.id }),
        deliveryService.getProducts(),
      ]);

      const productNames = new Map(
        (products || []).map((product) => [product.id, product.name])
      );

      const formattedRecords = (records || []).map((delivery) => ({
        ...delivery,
        items: (delivery.items || []).map((item) => ({
          ...item,
          productName:
            productNames.get(item.productId) ||
            item.productName ||
            item.productId ||
            "Product",
        })),
      }));

      setCustomerDeliveries(formattedRecords);
    } catch (error) {
      console.error("Unable to load customer deliveries:", error);
      setDeliveriesError(
        error?.message || "Unable to load delivery records."
      );
    } finally {
      setDeliveriesLoading(false);
    }
  }, [customer?.id]);

  // Refresh when delivery is saved/deleted or browser regains focus
  useEffect(() => {
    void loadCustomerDeliveries();

    const handleDeliveryUpdate = () => {
      void loadCustomerDeliveries();
    };

    window.addEventListener(
      "amrit-jal-deliveries-updated",
      handleDeliveryUpdate
    );

    window.addEventListener("focus", handleDeliveryUpdate);

    return () => {
      window.removeEventListener(
        "amrit-jal-deliveries-updated",
        handleDeliveryUpdate
      );

      window.removeEventListener("focus", handleDeliveryUpdate);
    };
  }, [loadCustomerDeliveries]);

  // Load customer profile
  useEffect(() => {
    let isMounted = true;

    async function loadCustomer() {
      setLoading(true);
      setLoadError("");
      setCustomer(null);

      // Validate UUID before making a database request.
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          customerId || ""
        );

      if (!isValidUUID) {
        setLoadError(
          "Invalid customer ID. Please open a valid customer record."
        );
        setLoading(false);
        return;
      }

      try {
        const result = await getCustomerById(customerId);

        if (!isMounted) return;

        if (result) {
          setCustomer(result);
        } else {
          setLoadError("This customer could not be found.");
        }
      } catch (error) {
        console.error("Failed to load customer:", error);

        if (isMounted) {
          setLoadError(
            error?.message || "Unable to load customer details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [customerId, getCustomerById, retryKey]);

  if (loading) return <LoadingState />;

  if (!customer || loadError) {
    return (
      <ErrorState
        message={loadError || "Customer could not be found."}
        onRetry={() => setRetryKey((value) => value + 1)}
      />
    );
  }

  const customerName =
    typeof customer.name === "string" && customer.name.trim()
      ? customer.name.trim()
      : "Unnamed Customer";

  const isArchived = Boolean(customer.archived);

  const menuItems = [
    {
      name: "Customer Profile",
      description: "Update customer basic details.",
      icon: UserRound,
      section: "Profile",
      available: true,
    },
    {
      name: "Customer Product",
      description: "Assign specific product to customer with specific rate.",
      icon: Package,
      section: "Products",
      available: true,
    },
    {
      name: "Opening Amount",
      description: "Add opening balance details for this customer.",
      icon: Wallet,
      section: "Opening Amount",
      available: true,
    },
    {
      name: "Opening Delivery",
      description:
        "Add previous delivered products for which you need to receive empty container.",
      icon: Truck,
      section: "Opening Delivery",
      available: true,
    },
    {
      name: "Security Deposit",
      description: "Add security deposit for this customer.",
      icon: CreditCard,
      section: "Security Deposit",
      available: true,
    },
    {
      name: "Customer Invoice Preference",
      description: "Set customer invoice preference.",
      icon: ReceiptText,
      section: "Invoice Preference",
      available: true,
    },
    {
      name: "SMS Setting",
      description: "SMS settings for this customer.",
      icon: FileText,
      section: "Message Settings",
      available: true,
    },
    {
      name: "Warn / Block",
      description: "Manage customer delivery restrictions",
      icon: ShieldCheck,
      section: "Warn / Block",
      available: true,
    },
    {
      name: "Unbalanced Products",
      description: "View outstanding empty container records",
      icon: Droplets,
      section: "Unbalanced Products",
      available: true,
    },
    {
      name: "Customer QR Code",
      description: "Share customer QR code.",
      icon: FileText,
      section: "Customer QR Code",
      available: true,
    },
    {
      name: "Invite to Customer App",
      description: "Invite customer to the customer application",
      icon: UserRound,
      section: "Invite",
      available: false,
    },
  ];

  const activeMenuItem = menuItems.find(
    (item) => item.section === activeSection
  );

  const tabToSection = {
    overview: "Profile",
    payments: "Payments",
    invoices: "Invoices",
    "monthly-card": "Monthly Card",
    deliveries: "Deliveries",
    ledger: "Ledger",
    leaves: "Leaves",
    "unbalance-products": "Tab Unbalanced Products",
  };

  function handleTabChange(nextTab) {
    setActiveTab(nextTab);
    setActiveSection(tabToSection[nextTab] || "Profile");
  }

  function handleSectionChange(nextSection) {
    setActiveSection(nextSection);

    const sectionToTab = {
      Profile: "overview",
      Payments: "payments",
      Invoices: "invoices",
      "Monthly Card": "monthly-card",
      Deliveries: "deliveries",
      Ledger: "ledger",
      Leaves: "leaves",
      "Tab Unbalanced Products": "unbalance-products",
    };

    setActiveTab(sectionToTab[nextSection] || "overview");
  }

  function renderSection() {
    switch (activeSection) {
      case "Profile":
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Customer Profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update customer basic details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem
                icon={UserRound}
                label="Customer Name"
                value={customerName}
              />

              <DetailItem
                icon={Phone}
                label="Mobile Number"
                value={customer.phone}
              />

              <DetailItem
                icon={MapPin}
                label="Full Address"
                value={customer.address}
              />

              <DetailItem
                icon={MapPin}
                label="Area"
                value={customer.area}
              />

              <DetailItem
                icon={Droplets}
                label="Price Per Jar"
                value={money(customer.jarRate)}
              />

              <DetailItem
                icon={Wallet}
                label="Opening Balance"
                value={money(customer.openingBalance)}
              />

              <DetailItem
                icon={FileText}
                label="Additional Notes"
                value={customer.notes}
              />

              <DetailItem
                icon={CalendarDays}
                label="Registration Date"
                value={formatDate(customer.createdAt)}
              />
            </div>

            {!isArchived && (
              <div className="flex justify-end">
                <Link
                  to={`/customers/${customer.id}/edit`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  <Pencil size={16} />
                  Edit Customer Profile
                </Link>
              </div>
            )}
          </div>
        );

      case "Products":
        return (
          <CustomerProducts
            customerId={customer.id}
            isArchived={isArchived}
            customerServiceApi={customerService}
          />
        );

      case "Opening Amount":
        return (
          <OpeningAmountSection
            customer={customer}
            isArchived={isArchived}
          />
        );

      case "Opening Delivery":
        return (
          <OpeningDeliverySection
            customer={customer}
            assignments={assignedProducts}
            isArchived={isArchived}
          />
        );

      case "Security Deposit":
        return (
          <SecurityDepositSection
            customer={customer}
            isArchived={isArchived}
          />
        );

      case "Invoice Preference":
        return (
          <InvoicePreferenceSection
            customer={customer}
            isArchived={isArchived}
          />
        );

      case "Message Settings":
        return (
          <MessageSettingsSection
            customer={customer}
            isArchived={isArchived}
          />
        );

      case "Warn / Block":
        return (
          <CustomerRestrictionsSection
            customer={customer}
            isArchived={isArchived}
          />
        );

      case "Unbalanced Products":
        return <UnbalancedProductsSection products={[]} />;

      case "Customer QR Code":
        return (
          <CustomerQRSection
            customer={customer}
            businessName="Amrit Jal"
          />
        );

      case "Payments":
        return (
          <CustomerPaymentsSection
            customer={customer}
            payments={[]}
          />
        );

      case "Invoices":
        return (
          <CustomerInvoicesSection
            customer={customer}
            invoices={customerInvoices}
            loading={invoicesLoading}
            error={invoicesError}
            onInvoiceClick={(invoice) => {
              if (invoice?.id) {
                window.location.href = `/invoices/${invoice.id}`;
              }
            }}

          />
        );

      case "Monthly Card":
        return (
          <CustomerMonthlyCardSection
            customer={customer}
            transactions={[]}
          />
        );

      // UPDATED CUSTOMER DELIVERY HISTORY

      case "Deliveries":
        return (
          <CustomerDeliverySection
            customer={customer}
            deliveries={customerDeliveries}
            loading={deliveriesLoading}
            error={deliveriesError}
            onRefresh={loadCustomerDeliveries}
            isArchived={isArchived}
          />
        );


      case "Ledger":
        return (
          <CustomerLedgerSection
            customer={customer}
            ledgerEntries={[]}
          />
        );

      case "Leaves":
        return (
          <CustomerLeavesSection
            customer={customer}
            leaves={[]}
          />
        );

      case "Tab Unbalanced Products":
        return (
          <CustomerUnbalancedProductsSection
            customer={customer}
            products={[]}
          />
        );

      default:
        return (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
              <Info size={25} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {activeMenuItem?.name || "Customer Feature"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {activeMenuItem?.description}
            </p>

            <span className="mt-4 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Not configured yet
            </span>
          </div>
        );
    }
  }

  return (
    <CustomerDetailLayout
      header={
        <>
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700"
          >
            <ArrowLeft size={17} />
            Back to Customers
          </Link>

          <CustomerDetailHeader
            customer={customer}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            balanceJars={0}
            dueAmount={Number(customer.openingBalance || 0)}
            pastDue={0}
            currentDue={0}
          />
        </>
      }
      sidebar={
        activeTab === "overview" ? (
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Details
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Customer details and settings
              </p>
            </div>

            <nav className="divide-y divide-slate-100">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const selected = activeSection === item.section;

                return (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => handleSectionChange(item.section)}
                    aria-current={selected ? "page" : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${selected
                      ? "bg-teal-50"
                      : "bg-white hover:bg-slate-50"
                      }`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selected
                        ? "bg-teal-100 text-teal-800"
                        : "bg-slate-50 text-slate-500"
                        }`}
                    >
                      <Icon size={19} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold ${selected
                          ? "text-teal-900"
                          : "text-slate-800"
                          }`}
                      >
                        {item.name}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {item.description}
                      </span>
                    </span>

                    <ChevronRight
                      size={17}
                      className="shrink-0 text-slate-400"
                    />
                  </button>
                );
              })}
            </nav>
          </aside>
        ) : null
      }
    >
      <CustomerDetailContent
        activeMenuItem={activeMenuItem}
        customerName={customerName}
      >
        {renderSection()}
      </CustomerDetailContent>

      <footer className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
        <CheckCircle2 size={14} />
        Amrit Jal · Customer Account
      </footer>
    </CustomerDetailLayout>
  );
}

/* ----------------------------------
   Empty sections
---------------------------------- */

function EmptySection({
  icon: Icon,
  title,
  description,
  link,
  linkLabel,
}) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon size={28} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {link && (
        <Link
          to={link}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {linkLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}