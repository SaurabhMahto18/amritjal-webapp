
import { useMemo } from "react";
import {
  FileText,
  UserRound,
  CalendarDays,
  Package,
  IndianRupee,
} from "lucide-react";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getValue = (...values) =>
  values.find((value) => value !== undefined && value !== null);

export default function InvoicePreview({
  invoice = {},
  customer = null,
  items = [],
}) {
  const deliveryItems = Array.isArray(items) ? items : [];

  const deliverySubtotal = useMemo(() => {
    const suppliedSubtotal = getValue(invoice.subtotal);

    if (suppliedSubtotal !== undefined) {
      return Number(suppliedSubtotal) || 0;
    }

    return deliveryItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
  }, [invoice.subtotal, deliveryItems]);

  const capsuleQty = Math.max(
    0,
    Number(invoice.capsuleJarLostQty) || 0
  );

  const thermalQty = Math.max(
    0,
    Number(invoice.thermalJarLostQty) || 0
  );

  const dispenserQty = Math.max(
    0,
    Number(invoice.dispenserJarLostQty) || 0
  );

  const lostJarItems = [
    {
      type: "Capsule Jar",
      quantity: capsuleQty,
      rate: 200,
      amount: capsuleQty * 200,
    },
    {
      type: "Thermal Jar",
      quantity: thermalQty,
      rate: 600,
      amount: thermalQty * 600,
    },
    {
      type: "Dispenser Jar",
      quantity: dispenserQty,
      rate: 150,
      amount: dispenserQty * 150,
    },
  ].filter((item) => item.quantity > 0);

  const calculatedLostCharges = lostJarItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const additionalCharges =
    Number(invoice.additionalCharges ?? invoice.additional_charges) ||
    calculatedLostCharges;

  const finalTotal =
    Number(
      getValue(invoice.totalAmount, invoice.total_amount)
    ) || deliverySubtotal + additionalCharges;

  const paidAmount = Number(
    getValue(invoice.paidAmount, invoice.paid_amount)
  ) || 0;

  const balance = Math.max(finalTotal - paidAmount, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Preview heading */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
        <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
          <FileText size={21} />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            Invoice Preview
          </h2>
          <p className="text-sm text-gray-500">
            Review the invoice details before saving.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Business header */}
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xl font-bold tracking-tight text-gray-900">
              AMRIT JAL
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Water Jar Delivery Service
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-2xl font-bold uppercase tracking-wide text-teal-800">
              Invoice
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Preview
            </p>
          </div>
        </div>

        {/* Customer and invoice information */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-500">
              <UserRound size={17} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Bill To
              </span>
            </div>

            <p className="font-semibold text-gray-900">
              {customer?.name || "Customer name"}
            </p>

            {customer?.phone && (
              <p className="mt-1 text-sm text-gray-600">
                Phone: {customer.phone}
              </p>
            )}

            {customer?.address && (
              <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
                {customer.address}
              </p>
            )}

            {!customer && (
              <p className="mt-1 text-sm text-gray-400">
                Select a customer to display their details.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-gray-500">
              <CalendarDays size={17} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Invoice Details
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Invoice date</span>
                <span className="text-right font-medium text-gray-900">
                  {formatDate(invoice.invoiceDate)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Period from</span>
                <span className="text-right font-medium text-gray-900">
                  {formatDate(invoice.periodStart)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Period to</span>
                <span className="text-right font-medium text-gray-900">
                  {formatDate(invoice.periodEnd)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery items */}
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">
            Delivery Details
          </h3>

          {deliveryItems.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[580px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left font-medium">
                      Description
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Qty
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Rate
                    </th>
                    <th className="px-3 py-3 text-right font-medium">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {deliveryItems.map((item, index) => (
                    <tr key={item.id || item.deliveryId || index}>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                        {formatDate(
                          item.deliveryDate ?? item.delivery_date
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-800">
                        {item.description || "Water jar delivery"}
                      </td>

                      <td className="px-3 py-3 text-right text-gray-700">
                        {Number(item.quantity) || 0}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right text-gray-700">
                        {currency(item.rate)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-gray-900">
                        {currency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              Selected deliveries will appear here.
            </div>
          )}
        </div>

        {/* Lost-jar charges */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Package size={18} className="text-amber-700" />
            <h3 className="font-semibold text-gray-900">
              Lost Jar Charges
            </h3>
          </div>

          {lostJarItems.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-amber-200">
              <table className="w-full min-w-[440px] text-sm">
                <thead className="bg-amber-50 text-amber-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Jar Type
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-amber-100">
                  {lostJarItems.map((item) => (
                    <tr key={item.type}>
                      <td className="px-4 py-3 text-gray-800">
                        {item.type}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                        {currency(item.rate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                        {currency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
              No lost-jar charges added.
            </div>
          )}
        </div>

        {/* Amount summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600">Delivery subtotal</span>
              <span className="font-medium text-gray-900">
                {currency(deliverySubtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-600">Lost-jar charges</span>
              <span className="font-medium text-gray-900">
                {currency(additionalCharges)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
              <span className="font-semibold text-gray-900">
                Total Amount
              </span>
              <span className="text-xl font-bold text-teal-800">
                {currency(finalTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-500">Amount paid</span>
              <span className="text-gray-700">
                {currency(paidAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-gray-700">
                Balance due
              </span>
              <span className="font-bold text-red-700">
                {currency(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes?.trim() && (
          <div className="rounded-xl bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Notes
            </h3>
            <p className="whitespace-pre-line text-sm text-gray-600">
              {invoice.notes}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-500">
            Thank you for choosing Amrit Jal.
          </p>
        </div>
      </div>
    </section>
  );
}
