
import { useRef } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Printer,
  ReceiptText,
  UserRound,
  Wallet,
} from "lucide-react";

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

const formatDate = (value) => {
  if (!value) return "—";

  const parts = String(value).split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return value;
};

/**
 * Printable receipt component.
 *
 * Props:
 * payment: {
 *   id, customerName, customerPhone, amount, date, method, notes,
 *   customerId, createdAt
 * }
 * businessName: optional business name
 * businessSubtitle: optional business description
 * onClose: optional callback for closing the receipt
 */
export default function PaymentReceipt({
  payment,
  businessName = "Amrit Jal",
  businessSubtitle = "R.O. Mineral Water Supplier",
  onClose,
}) {
  const receiptRef = useRef(null);

  if (!payment) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        No payment details are available for this receipt.
      </div>
    );
  }

  const paymentId = payment.id
    ? String(payment.id).slice(0, 8).toUpperCase()
    : "N/A";

  const method =
    methodLabels[payment.method] || payment.method || "Other";

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Payment Receipt
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review the receipt before printing.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100"
        >
          <Printer size={17} />
          Print Receipt
        </button>
      </div>

      <article
        ref={receiptRef}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none"
      >
        <header className="border-b-2 border-cyan-700 bg-cyan-50/70 px-5 py-7 text-center sm:px-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-700 text-white">
            <Wallet size={28} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {businessName}
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {businessSubtitle}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            Payment Recorded
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Receipt Number
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                AJ-PAY-{paymentId}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Payment Date
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(payment.date)}
              </p>
            </div>
          </div>

          <div className="py-6">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UserRound size={17} className="text-cyan-700" />
              Received From
            </div>

            <p className="text-lg font-semibold text-slate-900">
              {payment.customerName || "Unknown Customer"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {payment.customerPhone || "Phone number not available"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="text-sm font-medium text-slate-500">
              Amount Received
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
              {currency(payment.amount)}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-white p-2 text-cyan-700 shadow-sm">
                  <CreditCard size={18} />
                </span>

                <div>
                  <p className="text-xs text-slate-500">
                    Payment Mode
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {method}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-white p-2 text-cyan-700 shadow-sm">
                  <CalendarDays size={18} />
                </span>

                <div>
                  <p className="text-xs text-slate-500">
                    Transaction Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(payment.date)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {payment.notes && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                {payment.notes}
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-dashed border-slate-200 pt-6 text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-cyan-800">
              <ReceiptText size={18} />
              <span className="font-semibold">Payment Acknowledgement</span>
            </div>

            <p className="text-sm text-slate-500">
              This receipt acknowledges the payment recorded in the Amrit Jal
              system.
            </p>

            <p className="mt-4 text-xs text-slate-400">
              Please retain this receipt for your records.
            </p>
          </div>
        </div>
      </article>

      {onClose && (
        <div className="mt-4 flex justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close Receipt
          </button>
        </div>
      )}

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          [data-payment-receipt],
          [data-payment-receipt] * {
            visibility: visible;
          }

          [data-payment-receipt] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </section>
  );
}
