
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  LoaderCircle,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import paymentService from "../services/paymentService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const methodLabels = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

const displayDate = (value) => {
  if (!value) return "—";

  const parts = String(value).split("-");

  if (parts.length !== 3) return value;

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// ========================================
// SEO CONFIGURATION
// ========================================

const SEO = {
  title: "Payments | Amrit Jal",
  description:
    "Manage customer payments, cash collections, UPI transfers, bank payments, payment records and printable receipts in Amrit Jal.",
  robots: "noindex, nofollow, noarchive",
};

// ========================================
// CUSTOMER AVATAR
// ========================================

function CustomerAvatar({ name }) {
  const initials = String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800 ring-1 ring-cyan-200"
    >
      {initials || "?"}
    </span>
  );
}

// ========================================
// PAYMENT RECEIPT
// ========================================

function PaymentReceipt({ payment, onClose }) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="receipt-title"
              className="text-lg font-semibold text-slate-900"
            >
              Payment Receipt
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Amrit Jal — R.O. Mineral Water Supplier
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div
          id="payment-receipt-print"
          className="space-y-5 p-5 sm:p-7"
        >
          <div className="border-b border-dashed border-slate-300 pb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={28} />
            </div>

            <p className="text-sm text-slate-500">
              Payment Recorded
            </p>

            <p className="mt-1 text-3xl font-bold text-emerald-600">
              {currency(payment.amount)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Payment Date: {displayDate(payment.date)}
            </p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Customer</dt>
              <dd className="text-right font-semibold text-slate-900">
                {payment.customerName || "Unknown Customer"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Mobile</dt>
              <dd className="text-right font-medium text-slate-800">
                {payment.customerPhone || "—"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Payment Mode</dt>
              <dd className="text-right font-medium text-slate-800">
                {methodLabels[payment.method] ||
                  payment.method ||
                  "—"}
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Payment ID</dt>
              <dd className="max-w-[60%] break-all text-right font-mono text-xs text-slate-700">
                {payment.id}
              </dd>
            </div>

            {payment.notes && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Notes</dt>
                <dd className="max-w-[65%] whitespace-pre-wrap text-right text-slate-800">
                  {payment.notes}
                </dd>
              </div>
            )}
          </dl>

          <div className="border-t border-dashed border-slate-300 pt-4 text-center">
            <p className="text-sm font-medium text-slate-700">
              Thank you!
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Amrit Jal — R.O. Mineral Water Supplier
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </section>
    </div>
  );
}

// ========================================
// PAYMENTS PAGE
// ========================================

export default function PaymentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(location.state?.success || "");

  const [filterDate, setFilterDate] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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
          description.setAttribute(
            "content",
            previousDescription
          );
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
  // LOAD PAYMENTS
  // ======================================

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await paymentService.getPayments();

      setPayments(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.message || "Unable to load payment records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // ======================================
  // RECEIPT ESCAPE HANDLING
  // ======================================

  useEffect(() => {
    if (!selectedReceipt) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedReceipt(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedReceipt]);

  // ======================================
  // FILTER COUNTS
  // ======================================

  const activeFilterCount =
    Number(Boolean(filterDate)) +
    Number(filterMethod !== "all");

  // ======================================
  // FILTERED PAYMENTS
  // ======================================

  const visiblePayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesDate =
        !filterDate || payment.date === filterDate;

      const matchesMethod =
        filterMethod === "all" ||
        payment.method === filterMethod;

      const searchableValues = [
        payment.customerName,
        payment.customerPhone,
        payment.notes,
        payment.id,
        methodLabels[payment.method] || payment.method,
      ];

      const matchesSearch =
        !term ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(term)
        );

      return matchesDate && matchesMethod && matchesSearch;
    });
  }, [payments, filterDate, filterMethod, search]);

  // ======================================
  // PAYMENT TOTALS
  // ======================================

  const totalCollected = visiblePayments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  const cashTotal = visiblePayments
    .filter((payment) => payment.method === "cash")
    .reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

  const digitalTotal = visiblePayments
    .filter((payment) =>
      ["upi", "bank_transfer"].includes(payment.method)
    )
    .reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

  const otherTotal = visiblePayments
    .filter((payment) => payment.method === "other")
    .reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

  // ======================================
  // CLEAR FILTERS
  // ======================================

  const clearFilters = () => {
    setFilterDate("");
    setFilterMethod("all");
    setSearch("");
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <main className="min-h-screen bg-[#edf2f7] text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">

        {/* =================================
            PAGE ACTIONS
            Payments heading is in AppLayout
        ================================== */}

        <div className="flex flex-wrap items-center justify-end gap-2">
          

          
        </div>

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>

            <button
              type="button"
              aria-label="Dismiss success message"
              onClick={() => setSuccess("")}
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* SEARCH AND FILTERS */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-[560px]">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customer, mobile, payment ID..."
                aria-label="Search payments"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
              />
            </div>

            <button
              type="button"
              aria-expanded={showFilters}
              onClick={() =>
                setShowFilters((value) => !value)
              }
              className={`inline-flex items-center justify-center gap-2 self-start rounded-xl border px-4 py-3 text-sm font-medium transition sm:self-auto ${
                showFilters || activeFilterCount
                  ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter size={18} />
              Filters

              {activeFilterCount > 0 && (
                <span className="rounded-full bg-cyan-700 px-1.5 py-0.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
            type="button"
            onClick={() => navigate("/payments/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100"
          >
            <Plus size={17} />
            Record Payment
          </button>
          </div>

          {/* FILTER PANEL */}

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-[minmax(200px,280px)_minmax(200px,280px)_auto] lg:items-end">
              <div>
                <label
                  htmlFor="paymentFilterDate"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Payment Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="paymentFilterDate"
                    type="date"
                    value={filterDate}
                    onChange={(event) =>
                      setFilterDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="paymentFilterMethod"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Payment Mode
                </label>

                <select
                  id="paymentFilterMethod"
                  value={filterMethod}
                  onChange={(event) =>
                    setFilterMethod(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-4 focus:ring-cyan-50"
                >
                  <option value="all">All Payment Modes</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {(filterDate ||
                filterMethod !== "all" ||
                search) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="justify-self-start rounded-lg px-3 py-2.5 text-sm font-medium text-cyan-800 hover:bg-cyan-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* PAYMENT RECORDS */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-slate-500">
              <LoaderCircle
                size={28}
                className="animate-spin text-cyan-700"
              />

              <p className="text-sm">Loading payments...</p>
            </div>
          ) : visiblePayments.length === 0 ? (
            /* EMPTY STATE */

            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-cyan-50 p-4 text-cyan-700">
                <Wallet size={30} />
              </div>

              <h2 className="font-semibold text-slate-800">
                No payments found
              </h2>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                No payments match your search or filters. Record a payment to
                start tracking collections.
              </p>

              {(search || filterDate || filterMethod !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/payments/new")}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                <Plus size={17} />
                Record Payment
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE PAYMENT CARDS */}

              <div className="divide-y divide-slate-100 md:hidden">
                {visiblePayments.map((payment) => (
                  <article key={payment.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar name={payment.customerName} />

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {payment.customerName}
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {payment.customerPhone || "No phone number"}
                        </p>
                      </div>

                      <p className="shrink-0 font-semibold text-emerald-600">
                        {currency(payment.amount)}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">
                          Payment Mode
                        </p>

                        <span className="mt-1 inline-flex rounded-md bg-slate-200/70 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {methodLabels[payment.method] ||
                            payment.method ||
                            "—"}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Payment Date
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {displayDate(payment.date)}
                        </p>
                      </div>
                    </div>

                    {payment.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">
                        {payment.notes}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(payment)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Printer size={14} />
                      View / Print Receipt
                    </button>
                  </article>
                ))}
              </div>

              {/* DESKTOP PAYMENT TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] table-auto text-left text-sm">
                  <thead className="bg-[#edf2f7] text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Customer Name
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Receiver
                      </th>

                      <th className="px-5 py-4 text-right font-medium">
                        Amount
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Payment Mode
                      </th>

                      <th className="px-5 py-4 font-medium">
                        Payment Date
                      </th>

                      <th className="px-5 py-4 text-right font-medium">
                        Receipt
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {visiblePayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-4">
                            <CustomerAvatar name={payment.customerName} />

                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {payment.customerName}
                              </p>

                              {payment.customerPhone && (
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {payment.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-500">
                          —
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-emerald-600">
                          {currency(payment.amount)}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-blue-700">
                            {methodLabels[payment.method] ||
                              payment.method ||
                              "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-700">
                          {displayDate(payment.date)}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(payment)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                          >
                            <Printer size={14} />
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAYMENT TOTALS */}

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-5">
                <p className="text-sm text-slate-500">
                  Showing {visiblePayments.length} payment record
                  {visiblePayments.length === 1 ? "" : "s"}
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">
                      Total Collected
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {currency(totalCollected)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">
                      Cash
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {currency(cashTotal)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">
                      Digital
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {currency(digitalTotal)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">
                      Other
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {currency(otherTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* RECEIPT MODAL */}

      {selectedReceipt && (
        <>
          <style>
            {`
              @media print {
                body * {
                  visibility: hidden !important;
                }

                #payment-receipt-print,
                #payment-receipt-print * {
                  visibility: visible !important;
                }

                #payment-receipt-print {
                  position: absolute !important;
                  inset: 0 auto auto 0 !important;
                  width: 100% !important;
                  padding: 24px !important;
                  background: white !important;
                }

                @page {
                  size: auto;
                  margin: 12mm;
                }
              }
            `}
          </style>

          <PaymentReceipt
            payment={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        </>
      )}
    </main>
  );
}
