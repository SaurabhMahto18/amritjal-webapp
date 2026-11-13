import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  FileText,
  LoaderCircle,
  Save,
  Search,
  Users,
  Package,
  AlertCircle,
  RefreshCw,
  Info,
  Wallet,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { createInvoice } from "../services/invoiceService";
import InvoicePreview from "../components/InvoicePreview";

// ========================================
// HELPERS
// ========================================

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getDeliveryId = (delivery) => delivery.id;

const getDeliveryQuantity = (delivery) =>
  Number(delivery.jar_quantity ?? 0);

const getDeliveryRate = (delivery) =>
  Number(delivery.jar_rate ?? 0);

const getDeliveryAmount = (delivery) =>
  Number(
    delivery.amount ??
      getDeliveryQuantity(delivery) * getDeliveryRate(delivery)
  );

const getDeliveryDate = (delivery) =>
  delivery.delivery_date ?? "";

const formatDate = (value) => {
  if (!value) return "—";

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-");

  if (!year || !month || !day) return "—";

  return `${day}/${month}/${year}`;
};

// ========================================
// SEO
// ========================================

const SEO = {
  title: "Create Invoice | Amrit Jal",
  description:
    "Create customer invoices in Amrit Jal by selecting a billing period, customer and eligible water jar deliveries.",
  robots: "noindex, nofollow",
};

// ========================================
// REUSABLE SECTION HEADING
// ========================================

function StepHeading({
  number,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F5F2] text-[#087F8C]">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#087F8C]">
            STEP {number}
          </span>
        </div>

        <h2 className="mt-0.5 text-base font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

// ========================================
// INFO MESSAGE
// ========================================

function Message({ children, tone = "info" }) {
  const styles = {
    info: "border-cyan-100 bg-cyan-50 text-cyan-800",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  const Icon = tone === "error" ? AlertCircle : Info;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm leading-5 ${styles[tone]}`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

// ========================================
// CREATE INVOICE PAGE
// ========================================

export default function CreateInvoicePage() {
  const navigate = useNavigate();

  // ======================================
  // STATES
  // ======================================

  const [businessId, setBusinessId] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(getToday());
  const [periodStart, setPeriodStart] = useState(getToday());
  const [periodEnd, setPeriodEnd] = useState(getToday());

  const [notes, setNotes] = useState("");
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState([]);

  // Optional invoice charges.
  // Jar rates come from business invoice settings.

  const [thermalLostQty, setThermalLostQty] = useState("0");
  const [capsuleLostQty, setCapsuleLostQty] = useState("0");
  const [dispenserLostQty, setDispenserLostQty] = useState("0");

  const [additionalCharges, setAdditionalCharges] = useState("0");

  // Discount input
  const [discountAmountInput, setDiscountAmountInput] = useState("0");

  const [invoiceSettings, setInvoiceSettings] = useState({
    thermal_jar_charge: 600,
    capsule_jar_charge: 200,
    dispenser_jar_charge: 150,
  });

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [deliveryError, setDeliveryError] = useState("");

  const customerRequestRef = useRef(0);
  const deliveryRequestRef = useRef(0);

  // ======================================
  // SEO METADATA
  // ======================================

  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription =
      descriptionMeta?.getAttribute("content");

    const previousRobots =
      robotsMeta?.getAttribute("content");

    const description =
      descriptionMeta || document.createElement("meta");

    const robots =
      robotsMeta || document.createElement("meta");

    document.title = SEO.title;

    description.setAttribute("name", "description");
    description.setAttribute("content", SEO.description);

    robots.setAttribute("name", "robots");
    robots.setAttribute("content", SEO.robots);

    if (!descriptionMeta) {
      document.head.appendChild(description);
    }

    if (!robotsMeta) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        if (previousDescription === null) {
          description.removeAttribute("content");
        } else {
          description.setAttribute("content", previousDescription);
        }
      } else {
        description.remove();
      }

      if (robotsMeta) {
        if (previousRobots === null) {
          robots.removeAttribute("content");
        } else {
          robots.setAttribute("content", previousRobots);
        }
      } else {
        robots.remove();
      }
    };
  }, []);

  // ======================================
  // LOAD BUSINESS, CUSTOMERS AND GROUPS
  // ======================================

  const loadCustomers = useCallback(async () => {
    const requestId = ++customerRequestRef.current;

    setLoadingCustomers(true);
    setCustomerError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Please log in to create an invoice.");
      }

      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) throw businessError;

      if (!business) {
        throw new Error("Business account was not found.");
      }

      const [
        customerResult,
        groupResult,
        settingsResult,
      ] = await Promise.all([
        supabase
          .from("customers")
          .select(
            "id, name, phone, address, jar_rate, opening_balance, group_id"
          )
          .eq("business_id", business.id)
          .eq("archived", false)
          .order("name", { ascending: true }),

        supabase
          .from("customer_groups")
          .select("id, name")
          .eq("business_id", business.id)
          .order("name", { ascending: true }),

        supabase
          .from("business_invoice_settings")
          .select(
            "thermal_jar_charge, capsule_jar_charge, dispenser_jar_charge"
          )
          .eq("business_id", business.id)
          .maybeSingle(),
      ]);

      if (customerResult.error) throw customerResult.error;
      if (groupResult.error) throw groupResult.error;
      if (settingsResult.error) throw settingsResult.error;

      if (requestId !== customerRequestRef.current) return;

      setBusinessId(business.id);
      setCustomers(customerResult.data || []);
      setCustomerGroups(groupResult.data || []);

      setInvoiceSettings({
        thermal_jar_charge: Number(
          settingsResult.data?.thermal_jar_charge ?? 600
        ),
        capsule_jar_charge: Number(
          settingsResult.data?.capsule_jar_charge ?? 200
        ),
        dispenser_jar_charge: Number(
          settingsResult.data?.dispenser_jar_charge ?? 150
        ),
      });
    } catch (error) {
      console.error("Unable to load invoice customers:", error);

      if (requestId === customerRequestRef.current) {
        setCustomerError(
          error?.message || "Unable to load customers."
        );
      }
    } finally {
      if (requestId === customerRequestRef.current) {
        setLoadingCustomers(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCustomers();

    return () => {
      customerRequestRef.current += 1;
    };
  }, [loadCustomers]);

  // ======================================
  // SELECTED CUSTOMER
  // ======================================

  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          String(customer.id) === String(customerId)
      ) || null,
    [customers, customerId]
  );

  const selectedGroup = useMemo(
    () =>
      customerGroups.find(
        (group) =>
          String(group.id) === String(selectedGroupId)
      ) || null,
    [customerGroups, selectedGroupId]
  );

  // ======================================
  // CUSTOMER SEARCH
  // ======================================

  const filteredCustomers = useMemo(() => {
    if (!selectedGroupId) return [];

    const search = customerSearch.trim().toLocaleLowerCase();

    return customers
      .filter(
        (customer) =>
          String(customer.group_id || "") === String(selectedGroupId)
      )
      .filter((customer) => {
        if (!search) return true;

        const name = String(customer.name || "").toLocaleLowerCase();
        const phone = String(customer.phone || "").toLocaleLowerCase();

        return name.includes(search) || phone.includes(search);
      });
  }, [customers, selectedGroupId, customerSearch]);

  // ======================================
  // LOAD ELIGIBLE DELIVERIES
  // ======================================

  const loadDeliveries = useCallback(async () => {
    const requestId = ++deliveryRequestRef.current;

    setDeliveries([]);
    setSelectedDeliveryIds([]);
    setDeliveryError("");

    if (!businessId || !customerId || !periodStart || !periodEnd) {
      setLoadingDeliveries(false);
      return;
    }

    if (periodStart > periodEnd) {
      setLoadingDeliveries(false);
      setDeliveryError(
        "Billing start date cannot be after the end date."
      );
      return;
    }

    setLoadingDeliveries(true);

    try {
      const { data: deliveryData, error: deliveryFetchError } =
        await supabase
          .from("deliveries")
          .select(`
            id,
            business_id,
            customer_id,
            delivery_date,
            jar_quantity,
            jars_received,
            jar_rate,
            amount
          `)
          .eq("business_id", businessId)
          .eq("customer_id", customerId)
          .gte("delivery_date", periodStart)
          .lte("delivery_date", periodEnd)
          .order("delivery_date", { ascending: true });

      if (deliveryFetchError) throw deliveryFetchError;

      if (requestId !== deliveryRequestRef.current) return;

      const rows = deliveryData ?? [];

      if (rows.length === 0) {
        setDeliveries([]);
        return;
      }

      const deliveryIds = rows.map((delivery) => delivery.id);

      const { data: deliveryItems, error: itemsError } =
        await supabase
          .from("delivery_items")
          .select("id, delivery_id")
          .eq("business_id", businessId)
          .in("delivery_id", deliveryIds);

      if (itemsError) throw itemsError;

      if (requestId !== deliveryRequestRef.current) return;

      const itemIds = (deliveryItems ?? []).map(
        (item) => item.id
      );

      let billedItemIds = new Set();

      if (itemIds.length > 0) {
        const { data: invoiceLines, error: invoiceLinesError } =
          await supabase
            .from("invoice_lines")
            .select("source_delivery_item_id")
            .eq("business_id", businessId)
            .in("source_delivery_item_id", itemIds);

        if (invoiceLinesError) throw invoiceLinesError;

        if (requestId !== deliveryRequestRef.current) return;

        billedItemIds = new Set(
          (invoiceLines ?? [])
            .map((line) => line.source_delivery_item_id)
            .filter(Boolean)
        );
      }

      // Preserve the existing rule: exclude a delivery if
      // any of its delivery items has already been invoiced.

      const billedDeliveryIds = new Set(
        (deliveryItems ?? [])
          .filter((item) => billedItemIds.has(item.id))
          .map((item) => item.delivery_id)
      );

      const eligibleDeliveries = rows
        .filter(
          (delivery) => !billedDeliveryIds.has(delivery.id)
        )
        .filter((delivery) =>
          (deliveryItems ?? []).some(
            (item) => item.delivery_id === delivery.id
          )
        );

      if (requestId === deliveryRequestRef.current) {
        setDeliveries(eligibleDeliveries);
      }
    } catch (error) {
      console.error("Unable to load invoice deliveries:", error);

      if (requestId === deliveryRequestRef.current) {
        setDeliveryError(
          error?.message || "Unable to load deliveries."
        );
      }
    } finally {
      if (requestId === deliveryRequestRef.current) {
        setLoadingDeliveries(false);
      }
    }
  }, [businessId, customerId, periodStart, periodEnd]);

  useEffect(() => {
    void loadDeliveries();

    return () => {
      deliveryRequestRef.current += 1;
    };
  }, [loadDeliveries]);

  // ======================================
  // SELECTED DELIVERY DATA
  // ======================================

  const selectedDeliveries = useMemo(() => {
    const selectedIds = new Set(
      selectedDeliveryIds.map(String)
    );

    return deliveries.filter((delivery) =>
      selectedIds.has(String(getDeliveryId(delivery)))
    );
  }, [deliveries, selectedDeliveryIds]);

  const subtotal = useMemo(
    () =>
      selectedDeliveries.reduce(
        (total, delivery) =>
          total + getDeliveryAmount(delivery),
        0
      ),
    [selectedDeliveries]
  );

  const totalJars = useMemo(
    () =>
      selectedDeliveries.reduce(
        (total, delivery) =>
          total + getDeliveryQuantity(delivery),
        0
      ),
    [selectedDeliveries]
  );

  // ======================================
  // LOST JAR CHARGES
  // ======================================

  const lostJarCharges = useMemo(() => {
    const thermal =
      Math.max(0, Number(thermalLostQty) || 0) *
      invoiceSettings.thermal_jar_charge;

    const capsule =
      Math.max(0, Number(capsuleLostQty) || 0) *
      invoiceSettings.capsule_jar_charge;

    const dispenser =
      Math.max(0, Number(dispenserLostQty) || 0) *
      invoiceSettings.dispenser_jar_charge;

    return Number(
      (thermal + capsule + dispenser).toFixed(2)
    );
  }, [
    thermalLostQty,
    capsuleLostQty,
    dispenserLostQty,
    invoiceSettings,
  ]);

  // ======================================
  // ADDITIONAL AMOUNT
  // ======================================

  const manualAdditionalCharges = Math.max(
    0,
    Number(additionalCharges) || 0
  );

  const additionalAmountTotal = Number(
    (lostJarCharges + manualAdditionalCharges).toFixed(2)
  );

  // ======================================
  // DISCOUNT CALCULATION
  // ======================================

  const discountNumber =
    discountAmountInput.trim() === ""
      ? 0
      : Number(discountAmountInput);

  const discountAmount = Number.isFinite(discountNumber)
    ? Math.max(0, discountNumber)
    : 0;

  const discountableSubtotal = Number(
    (subtotal + additionalAmountTotal).toFixed(2)
  );

  const estimatedInvoiceTotal = Number(
    Math.max(
      0,
      discountableSubtotal - discountAmount
    ).toFixed(2)
  );

  // ======================================
  // DELIVERY SELECTION STATUS
  // ======================================

  const allDeliveriesSelected =
    deliveries.length > 0 &&
    deliveries.every((delivery) =>
      selectedDeliveryIds.some(
        (id) => String(id) === String(getDeliveryId(delivery))
      )
    );

  // ======================================
  // GROUP / CUSTOMER ACTIONS
  // ======================================

  function handleGroupChange(value) {
    setSelectedGroupId(value);
    setCustomerId("");
    setCustomerSearch("");
    setDeliveries([]);
    setSelectedDeliveryIds([]);
    setDeliveryError("");
    setPageError("");
  }

  function handleCustomerChange(value) {
    setCustomerId(value);
    setSelectedDeliveryIds([]);
    setDeliveryError("");
    setPageError("");
  }

  // ======================================
  // DELIVERY SELECTION
  // ======================================

  function toggleDelivery(delivery) {
    const id = getDeliveryId(delivery);

    if (!id) return;

    setSelectedDeliveryIds((current) => {
      const exists = current.some(
        (selectedId) => String(selectedId) === String(id)
      );

      return exists
        ? current.filter(
            (selectedId) => String(selectedId) !== String(id)
          )
        : [...current, id];
    });

    setPageError("");
  }

  function selectAllDeliveries() {
    const allIds = deliveries
      .map(getDeliveryId)
      .filter(Boolean);

    setSelectedDeliveryIds(
      allDeliveriesSelected ? [] : allIds
    );

    setPageError("");
  }

  // ======================================
  // CREATE INVOICE
  // ======================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setPageError("");

    if (!businessId) {
      setPageError("Business account is not available.");
      return;
    }

    if (!customerId || !selectedCustomer) {
      setPageError("Please select a customer.");
      return;
    }

    if (!invoiceDate || !periodStart || !periodEnd) {
      setPageError("Please complete all required date fields.");
      return;
    }

    if (periodStart > periodEnd) {
      setPageError(
        "Billing period start date cannot be after the end date."
      );
      return;
    }

    if (selectedDeliveryIds.length === 0) {
      setPageError(
        "Please select at least one eligible delivery."
      );
      return;
    }

    // Validate lost-jar quantities.

    const lostJarQuantities = [
      thermalLostQty,
      capsuleLostQty,
      dispenserLostQty,
    ];

    if (
      lostJarQuantities.some(
        (quantity) =>
          quantity === "" ||
          !Number.isInteger(Number(quantity)) ||
          Number(quantity) < 0
      )
    ) {
      setPageError(
        "Lost-jar quantities must be whole numbers of zero or more."
      );
      return;
    }

    // Validate manual additional charge.

    if (
      additionalCharges === "" ||
      !Number.isFinite(Number(additionalCharges)) ||
      Number(additionalCharges) < 0
    ) {
      setPageError(
        "Additional amount must be a valid non-negative value."
      );
      return;
    }

    // Validate discount.

    if (
      discountAmountInput.trim() !== "" &&
      (
        !Number.isFinite(Number(discountAmountInput)) ||
        Number(discountAmountInput) < 0
      )
    ) {
      setPageError(
        "Discount must be a valid non-negative amount."
      );
      return;
    }

    if (discountAmount > discountableSubtotal) {
      setPageError(
        "Discount cannot be greater than the current invoice amount."
      );
      return;
    }

    setSaving(true);

    try {
      const createdInvoice = await createInvoice({
        businessId,
        customerId,

        invoiceData: {
          invoice_date: invoiceDate,
          period_start: periodStart,
          period_end: periodEnd,

          notes: notes.trim(),

          thermal_jar_lost_qty: Number(thermalLostQty),
          capsule_jar_lost_qty: Number(capsuleLostQty),
          dispenser_jar_lost_qty: Number(dispenserLostQty),

          additional_charges: Number(additionalCharges),

          // Discount sent to invoiceService.
          discount_amount: discountAmount,
        },

        deliveryIds: selectedDeliveryIds,
        settings: invoiceSettings,
      });

      if (!createdInvoice?.id) {
        throw new Error(
          "Invoice ID was not returned. Check the invoice list before trying again."
        );
      }

      navigate(`/invoices/${createdInvoice.id}`, {
        replace: true,
        state: {
          message: "Invoice created successfully.",
        },
      });
    } catch (error) {
      console.error("Invoice creation failed:", error);

      setPageError(
        error?.message ||
          "Unable to create invoice. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ======================================
  // CONDITIONAL INFORMATION
  // ======================================

  const canCreateInvoice =
    Boolean(businessId) &&
    Boolean(selectedCustomer) &&
    selectedDeliveryIds.length > 0 &&
    !loadingCustomers &&
    !loadingDeliveries &&
    !saving &&
    periodStart <= periodEnd;

  // ======================================
  // MAIN UI
  // ======================================

  return (
    <main className="min-h-screen bg-[#edf2f7] px-3 py-5 text-slate-900 sm:px-5 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[1350px] space-y-5"
      >

        {/* =================================
            TOP ACTION BAR
            Shared title is in AppLayout
        ================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/invoices"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back to Invoices
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full bg-[#E5F5F2] px-3 py-2 text-xs font-semibold text-[#087F8C]">
            <FileText size={15} />
            New Invoice
          </span>
        </div>

        {/* =================================
            ERROR MESSAGE
        ================================== */}

        {pageError && (
          <Message tone="error">
            {pageError}
          </Message>
        )}

        {/* =================================
            STEP 1 — BILLING PERIOD
        ================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <StepHeading
            number="01"
            title="Invoice Dates"
            description="Choose when the invoice is issued and which delivery period it covers."
            icon={CalendarDays}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <label className="min-w-0">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Invoice Date <span className="text-rose-500">*</span>
              </span>

              <input
                type="date"
                required
                value={invoiceDate}
                disabled={saving}
                onChange={(event) =>
                  setInvoiceDate(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
              />

              <span className="mt-1 block text-xs text-slate-400">
                Date printed on the invoice
              </span>
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Billing From <span className="text-rose-500">*</span>
              </span>

              <input
                type="date"
                required
                value={periodStart}
                max={periodEnd || undefined}
                disabled={saving}
                onChange={(event) =>
                  setPeriodStart(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
              />
            </label>

            <label className="min-w-0">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Billing To <span className="text-rose-500">*</span>
              </span>

              <input
                type="date"
                required
                value={periodEnd}
                min={periodStart || undefined}
                disabled={saving}
                onChange={(event) =>
                  setPeriodEnd(event.target.value)
                }
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
              />
            </label>
          </div>

          {periodStart > periodEnd && (
            <div className="mt-4">
              <Message tone="error">
                Billing start date cannot be after the end date.
              </Message>
            </div>
          )}
        </section>

        {/* =================================
            STEP 2 — CUSTOMER SELECTION
        ================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <StepHeading
            number="02"
            title="Select Customer"
            description="Choose a customer group first, then find the customer to bill."
            icon={Users}
          />

          {customerError && (
            <div className="mb-4 space-y-3">
              <Message tone="error">
                {customerError}
              </Message>

              <button
                type="button"
                onClick={loadCustomers}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#087F8C]"
              >
                <RefreshCw size={15} />
                Retry loading customers
              </button>
            </div>
          )}

          {loadingCustomers ? (
            <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle
                size={19}
                className="animate-spin text-[#087F8C]"
              />
              Loading customers and groups...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* GROUP SELECT */}

                <label className="min-w-0">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Customer Group
                    <span className="ml-1 text-rose-500">*</span>
                  </span>

                  <select
                    value={selectedGroupId}
                    disabled={saving}
                    onChange={(event) =>
                      handleGroupChange(event.target.value)
                    }
                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
                  >
                    <option value="">Select a group</option>

                    {customerGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>

                  {customerGroups.length === 0 && (
                    <span className="mt-1.5 block text-xs text-amber-700">
                      No groups found.{" "}
                      <Link
                        to="/groups/new"
                        className="font-semibold underline"
                      >
                        Create a group
                      </Link>
                    </span>
                  )}
                </label>

                {/* CUSTOMER SEARCH */}

                <label className="min-w-0">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Search Customer
                  </span>

                  <div className="relative">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="search"
                      value={customerSearch}
                      onChange={(event) =>
                        setCustomerSearch(event.target.value)
                      }
                      disabled={!selectedGroupId || saving}
                      placeholder={
                        selectedGroupId
                          ? "Name or mobile number..."
                          : "Select a group first"
                      }
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
                    />
                  </div>
                </label>
              </div>

              {/* CUSTOMER SELECT */}

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Customer <span className="text-rose-500">*</span>
                </span>

                <select
                  value={customerId}
                  required
                  disabled={!selectedGroupId || saving}
                  onChange={(event) =>
                    handleCustomerChange(event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
                >
                  <option value="">
                    {!selectedGroupId
                      ? "Select a group first"
                      : filteredCustomers.length
                        ? "Select a customer"
                        : "No matching customers"}
                  </option>

                  {filteredCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone
                        ? ` — ${customer.phone}`
                        : ""}
                    </option>
                  ))}
                </select>

                {selectedGroupId &&
                  filteredCustomers.length === 0 && (
                    <span className="mt-1.5 block text-xs text-slate-500">
                      {customerSearch
                        ? "No customers match your search in this group."
                        : "No active customers assigned to this group."}
                    </span>
                  )}
              </label>
            </>
          )}

          {/* SELECTED CUSTOMER CARD */}

          {selectedCustomer && (
            <div className="mt-5 rounded-xl border border-[#CDE9E4] bg-[#F1FAF8] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#087F8C]">
                    <Users size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words font-bold text-slate-900">
                      {selectedCustomer.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {selectedCustomer.phone || "No mobile number"}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#087F8C]">
                  {selectedGroup?.name || "Selected Group"}
                </span>
              </div>

              {selectedCustomer.address && (
                <p className="mt-3 border-t border-[#D9EDE8] pt-3 text-xs text-slate-500">
                  {selectedCustomer.address}
                </p>
              )}
            </div>
          )}
        </section>

        {/* =================================
            STEP 3 — DELIVERY SELECTION
        ================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <StepHeading
                number="03"
                title="Select Deliveries"
                description="Choose the unbilled delivery records to include."
                icon={Package}
              />

              {deliveries.length > 0 && !loadingDeliveries && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={selectAllDeliveries}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[#BBDDD6] px-4 py-2 text-sm font-semibold text-[#087F8C] transition hover:bg-[#E5F5F2] disabled:opacity-50"
                >
                  {allDeliveriesSelected
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {/* NO CUSTOMER */}

            {!customerId && !loadingDeliveries && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <Package
                  size={30}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-semibold text-slate-700">
                  Select a customer first
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Eligible deliveries will appear here.
                </p>
              </div>
            )}

            {/* LOADING */}

            {loadingDeliveries && (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle
                  size={25}
                  className="animate-spin text-[#087F8C]"
                />

                Loading eligible deliveries...
              </div>
            )}

            {/* DELIVERY ERROR */}

            {!loadingDeliveries && deliveryError && (
              <div className="space-y-3">
                <Message tone="error">
                  {deliveryError}
                </Message>

                <button
                  type="button"
                  onClick={loadDeliveries}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#087F8C]"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            )}

            {/* NO DELIVERIES */}

            {!loadingDeliveries &&
              !deliveryError &&
              customerId &&
              deliveries.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                  <CalendarDays
                    size={30}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-3 font-semibold text-slate-700">
                    No eligible deliveries found
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                    No unbilled delivery records are available for this
                    customer and billing period.
                  </p>
                </div>
              )}

            {/* DESKTOP DELIVERY TABLE */}

            {!loadingDeliveries &&
              !deliveryError &&
              deliveries.length > 0 && (
                <>
                  <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead className="bg-[#F4F7F9] text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="w-12 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={allDeliveriesSelected}
                              onChange={selectAllDeliveries}
                              disabled={saving}
                              aria-label="Select all deliveries"
                              className="size-4 accent-[#087F8C]"
                            />
                          </th>

                          <th className="px-4 py-3">
                            Delivery Date
                          </th>

                          <th className="px-4 py-3">
                            Description
                          </th>

                          <th className="px-4 py-3 text-right">
                            Jars
                          </th>

                          <th className="px-4 py-3 text-right">
                            Rate
                          </th>

                          <th className="px-4 py-3 text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {deliveries.map((delivery) => {
                          const id = getDeliveryId(delivery);

                          const checked = selectedDeliveryIds.some(
                            (selectedId) =>
                              String(selectedId) === String(id)
                          );

                          return (
                            <tr
                              key={id}
                              className={
                                checked
                                  ? "bg-[#F0FAF8]"
                                  : "transition hover:bg-slate-50"
                              }
                            >
                              <td className="px-4 py-3.5">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={!id || saving}
                                  onChange={() =>
                                    toggleDelivery(delivery)
                                  }
                                  aria-label={`Select delivery on ${getDeliveryDate(delivery)}`}
                                  className="size-4 accent-[#087F8C]"
                                />
                              </td>

                              <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                                {formatDate(getDeliveryDate(delivery))}
                              </td>

                              <td className="px-4 py-3.5 font-medium text-slate-700">
                                Water jar delivery
                              </td>

                              <td className="px-4 py-3.5 text-right tabular-nums">
                                {getDeliveryQuantity(delivery)}
                              </td>

                              <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">
                                {currency(getDeliveryRate(delivery))}
                              </td>

                              <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                                {currency(getDeliveryAmount(delivery))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE DELIVERY CARDS */}

                  <div className="space-y-2 md:hidden">
                    {deliveries.map((delivery) => {
                      const id = getDeliveryId(delivery);

                      const checked = selectedDeliveryIds.some(
                        (selectedId) =>
                          String(selectedId) === String(id)
                      );

                      return (
                        <label
                          key={id}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                            checked
                              ? "border-[#8BCDC1] bg-[#F0FAF8]"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={saving}
                            onChange={() => toggleDelivery(delivery)}
                            className="mt-1 size-4 shrink-0 accent-[#087F8C]"
                          />

                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-800">
                                {formatDate(getDeliveryDate(delivery))}
                              </span>

                              <span className="text-sm font-bold text-slate-900">
                                {currency(getDeliveryAmount(delivery))}
                              </span>
                            </span>

                            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>
                                Jars: {getDeliveryQuantity(delivery)}
                              </span>

                              <span>
                                Rate: {currency(getDeliveryRate(delivery))}
                              </span>
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
          </div>

          {/* SELECTED DELIVERY TOTAL */}

          {selectedDeliveryIds.length > 0 && (
            <div className="grid grid-cols-2 gap-3 border-t border-[#D9EDE8] bg-[#F1FAF8] p-4 sm:grid-cols-3 sm:px-6">
              <div>
                <p className="text-xs text-slate-500">
                  Selected Records
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {selectedDeliveryIds.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Total Jars
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {totalJars}
                </p>
              </div>

              <div className="col-span-2 border-t border-[#D9EDE8] pt-3 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <p className="text-xs text-slate-500">
                  Selected Delivery Amount
                </p>

                <p className="mt-1 text-xl font-extrabold text-[#087F68]">
                  {currency(subtotal)}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* =================================
            STEP 4 — ADDITIONAL CHARGES
        ================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <StepHeading
            number="04"
            title="Additional Charges"
            description="Add lost-jar charges using your saved rates, or enter another extra amount."
            icon={Wallet}
          />

          <div className="mb-4 rounded-xl border border-[#D9EDE8] bg-[#F1FAF8] p-3.5 text-sm text-slate-600">
            Lost-jar rates are loaded from Invoice Settings. You only need to enter the number of lost jars; the charge is calculated automatically.
          </div>

          {/* LOST JAR QUANTITIES */}

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Thermal Jar",
                value: thermalLostQty,
                setter: setThermalLostQty,
                rate: invoiceSettings.thermal_jar_charge,
                field: "thermalLostQty",
              },
              {
                label: "Capsule Jar",
                value: capsuleLostQty,
                setter: setCapsuleLostQty,
                rate: invoiceSettings.capsule_jar_charge,
                field: "capsuleLostQty",
              },
              {
                label: "Dispenser Jar",
                value: dispenserLostQty,
                setter: setDispenserLostQty,
                rate: invoiceSettings.dispenser_jar_charge,
                field: "dispenserLostQty",
              },
            ].map((item) => (
              <div
                key={item.field}
                className="rounded-xl border border-slate-200 p-4"
              >
                <label
                  className="block text-sm font-semibold text-slate-800"
                  htmlFor={item.field}
                >
                  {item.label} — Lost quantity
                </label>

                <input
                  id={item.field}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={item.value}
                  disabled={saving}
                  onChange={(event) =>
                    item.setter(event.target.value)
                  }
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
                />

                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Saved rate</span>

                  <strong className="text-slate-700">
                    {currency(item.rate)} / jar
                  </strong>
                </div>

                <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500">
                    Charge
                  </span>

                  <strong className="text-slate-900">
                    {currency(
                      (Number(item.value) || 0) * item.rate
                    )}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          {/* OTHER ADDITIONAL AMOUNT */}

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
            <label className="block">
              <span className="block text-sm font-semibold text-slate-700">
                Other Additional Amount (₹)
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={additionalCharges}
                disabled={saving}
                onChange={(event) =>
                  setAdditionalCharges(event.target.value)
                }
                placeholder="0.00"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
              />

              <span className="mt-1.5 block text-xs text-slate-400">
                Optional manual amount, such as delivery or service charges.
              </span>
            </label>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between gap-3 text-sm text-slate-600">
                <span>Lost-jar charges</span>

                <strong className="text-slate-800">
                  {currency(lostJarCharges)}
                </strong>
              </div>

              <div className="mt-2 flex justify-between gap-3 text-sm text-slate-600">
                <span>Other amount</span>

                <strong className="text-slate-800">
                  {currency(manualAdditionalCharges)}
                </strong>
              </div>

              <div className="mt-3 flex justify-between gap-3 border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
                <span>Additional total</span>

                <span>
                  {currency(additionalAmountTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* DISCOUNT */}

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
            <label className="block">
              <span className="block text-sm font-semibold text-slate-700">
                Discount Amount (₹)
              </span>

              <input
                type="number"
                min="0"
                max={discountableSubtotal}
                step="0.01"
                inputMode="decimal"
                value={discountAmountInput}
                disabled={saving}
                onChange={(event) =>
                  setDiscountAmountInput(event.target.value)
                }
                placeholder="0.00"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
              />

              <span className="mt-1.5 block text-xs text-slate-400">
                Optional flat discount. It cannot exceed delivery and additional charges.
              </span>
            </label>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex justify-between gap-3 text-sm text-slate-600">
                <span>Current amount</span>

                <strong>
                  {currency(discountableSubtotal)}
                </strong>
              </div>

              <div className="mt-2 flex justify-between gap-3 text-sm text-emerald-700">
                <span>Discount</span>

                <strong>
                  − {currency(discountAmount)}
                </strong>
              </div>

              <div className="mt-3 flex justify-between gap-3 border-t border-emerald-200 pt-3 text-sm font-bold text-slate-900">
                <span>After discount</span>

                <span className="text-[#087F68]">
                  {currency(estimatedInvoiceTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================
            STEP 5 — NOTES AND REVIEW
        ================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <StepHeading
            number="05"
            title="Review Invoice"
            description="Check the selected customer, billing amount and notes before creating the invoice."
            icon={FileText}
          />

          {/* SELECTED CUSTOMER */}

          {selectedCustomer && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Users size={14} />
                Bill To
              </div>

              <p className="mt-2 font-bold text-slate-900">
                {selectedCustomer.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {selectedCustomer.phone || "No mobile number"}
              </p>
            </div>
          )}

          {/* AMOUNT REVIEW */}

          <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Selected Deliveries
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedDeliveryIds.length} record(s) · {totalJars} jars
                </p>
              </div>

              <p className="text-base font-bold text-slate-900">
                {currency(subtotal)}
              </p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <Info size={17} className="mt-0.5 shrink-0" />

                <p className="leading-5">
                  <strong>Previous Outstanding:</strong> Any earlier
                  unpaid balance will be calculated during invoice
                  generation and shown as a separate line. It is not
                  included in the estimate below.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between gap-3 text-slate-600">
                <span>Delivery subtotal</span>

                <strong className="text-slate-800">
                  {currency(subtotal)}
                </strong>
              </div>

              <div className="flex justify-between gap-3 text-slate-600">
                <span>Lost-jar charges</span>

                <strong className="text-slate-800">
                  {currency(lostJarCharges)}
                </strong>
              </div>

              <div className="flex justify-between gap-3 text-slate-600">
                <span>Other additional amount</span>

                <strong className="text-slate-800">
                  {currency(manualAdditionalCharges)}
                </strong>
              </div>

              <div className="flex justify-between gap-3 text-emerald-700">
                <span>Discount</span>

                <strong>
                  − {currency(discountAmount)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-900">
                  Estimated Total (before previous outstanding)
                </span>

                <span className="text-xl font-extrabold text-[#087F68]">
                  {currency(estimatedInvoiceTotal)}
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Previous outstanding, if any, is added separately by the database when the invoice is generated.
            </p>
          </div>

          {/* NOTES */}

          <div className="mt-5">
            <label
              htmlFor="invoiceNotes"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Invoice Notes{" "}
              <span className="font-normal text-slate-400">
                (Optional)
              </span>
            </label>

            <textarea
              id="invoiceNotes"
              rows={3}
              maxLength={2000}
              value={notes}
              disabled={saving}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add payment instructions or additional information..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {notes.length}/2000
            </p>
          </div>
        </section>

        {/* =================================
            LIVE INVOICE PREVIEW
        ================================== */}

        {selectedCustomer && selectedDeliveryIds.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FileText size={18} className="text-[#087F8C]" />

              <h2 className="font-bold text-slate-900">
                Invoice Preview
              </h2>
            </div>

            <InvoicePreview
              invoice={{
                invoiceDate,
                periodStart,
                periodEnd,
                notes,
                subtotal,

                discountAmount,
                discount_amount: discountAmount,

                totalAmount: estimatedInvoiceTotal,

                additionalCharges: manualAdditionalCharges,
                lostJarCharges,

                paidAmount: 0,
              }}
              customer={selectedCustomer}
              items={selectedDeliveries.map((delivery) => ({
                id: getDeliveryId(delivery),
                delivery_id: getDeliveryId(delivery),
                description: "Water jar delivery",
                deliveryDate: getDeliveryDate(delivery),
                quantity: getDeliveryQuantity(delivery),
                rate: getDeliveryRate(delivery),
                amount: getDeliveryAmount(delivery),
              }))}
            />
          </section>
        )}

        {/* =================================
            FINAL ACTIONS
        ================================== */}

        <div className="sticky bottom-0 z-20 -mx-3 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="flex flex-col gap-3 rounded-xl sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                Estimated total after discount
              </p>

              <p className="text-xl font-extrabold text-slate-900">
                {currency(estimatedInvoiceTotal)}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Link
                to="/invoices"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={!canCreateInvoice}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#066B76] focus:outline-none focus:ring-4 focus:ring-[#087F8C]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}