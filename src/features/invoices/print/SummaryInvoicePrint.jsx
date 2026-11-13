
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer, LoaderCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { getInvoiceById } from "../services/invoiceService";
import {
  formatCurrency,
  formatDate,
  formatInvoiceNumber,
  toNumber,
} from "../utils/invoiceUtils";

export default function SummaryInvoicePrint() {
  const { invoiceId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) throw new Error("Please log in first.");

        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("owner_id", auth.user.id)
          .single();

        if (businessError) throw businessError;

        const invoice = await getInvoiceById(invoiceId, business.id);

        const [customerResult, settingsResult] = await Promise.all([
          supabase
            .from("customers")
            .select("name, code, phone, address, area")
            .eq("id", invoice.customer_id)
            .maybeSingle(),
          supabase
            .from("business_invoice_settings")
            .select("*")
            .eq("business_id", business.id)
            .maybeSingle(),
        ]);

        if (customerResult.error) throw customerResult.error;
        if (settingsResult.error) throw settingsResult.error;

        if (active) {
          setData({
            invoice,
            customer: customerResult.data,
            settings: settingsResult.data,
            business,
          });
        }
      } catch (e) {
        if (active) setError(e.message || "Could not load summary.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2">
        <LoaderCircle className="animate-spin" /> Loading summary...
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="p-6">
        <p className="text-red-700">{error || "Invoice not found."}</p>
        <Link className="mt-3 inline-block underline" to={`/invoices/${invoiceId}`}>
          Back to invoice
        </Link>
      </main>
    );
  }

  const { invoice, customer, settings, business } = data;
  const items = invoice.items || [];
  const subtotal = toNumber(invoice.subtotal);
  const charges = toNumber(invoice.additional_charges);
  const total = toNumber(invoice.total_amount);
  const paid = toNumber(invoice.paid_amount);
  const balance = Math.max(0, total - paid);
  const quantity = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .summary-paper { max-width: none !important; margin: 0 !important;
            padding: 0 !important; border: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-between gap-3">
        <Link to={`/invoices/${invoiceId}`} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold">
          <ArrowLeft size={16} /> Back
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      <article className="summary-paper mx-auto max-w-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <header className="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-5">
          <div className="flex items-start gap-3">
            {settings?.business_logo_url && (
              <img src={settings.business_logo_url} alt="Business logo" className="h-16 w-16 object-contain" />
            )}
            <div>
              <h1 className="text-xl font-extrabold">{business.name || "Business"}</h1>
              {settings?.business_address && <p className="mt-1 text-sm">{settings.business_address}</p>}
              {settings?.business_phone && <p className="mt-1 text-sm">Phone: {settings.business_phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black">SUMMARY</h2>
            <p className="mt-2 text-sm font-bold">{formatInvoiceNumber(invoice.invoice_number)}</p>
            <p className="mt-1 text-sm">{formatDate(invoice.invoice_date)}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 border-b py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer</p>
            <p className="mt-2 text-lg font-bold">{customer?.name || "Customer"}</p>
            {customer?.code && <p className="mt-1 text-sm">Code: {customer.code}</p>}
            {customer?.phone && <p className="mt-1 text-sm">Phone: {customer.phone}</p>}
            {customer?.address && <p className="mt-1 text-sm">{customer.address}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Billing period</p>
            <p className="mt-2 font-semibold">{formatDate(invoice.period_start)}</p>
            <p className="mt-1 text-sm">to {formatDate(invoice.period_end)}</p>
            <p className="mt-3 text-sm">Delivery rows: {items.length}</p>
            <p className="mt-1 text-sm">Total jars / quantity: {quantity}</p>
          </div>
        </section>

        <section className="py-6">
          <h3 className="mb-3 font-bold">Billing summary</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="flex justify-between gap-4 border-b px-4 py-3">
              <span>Delivery subtotal</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4 border-b px-4 py-3">
              <span>Additional / jar charges</span>
              <span className="font-semibold">{formatCurrency(charges)}</span>
            </div>
            <div className="flex justify-between gap-4 bg-slate-50 px-4 py-4 text-lg font-extrabold">
              <span>Total invoice amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t px-4 py-3">
              <span>Paid amount</span><span>{formatCurrency(paid)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t px-4 py-3 font-bold">
              <span>Outstanding balance</span><span>{formatCurrency(balance)}</span>
            </div>
          </div>
        </section>

        <section className="border-t py-5">
          <h3 className="font-bold">Lost jar quantities</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Thermal jars</p>
              <p className="mt-1 text-lg font-bold">{toNumber(invoice.thermal_jar_lost_qty)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Capsule jars</p>
              <p className="mt-1 text-lg font-bold">{toNumber(invoice.capsule_jar_lost_qty)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Dispenser jars</p>
              <p className="mt-1 text-lg font-bold">{toNumber(invoice.dispenser_jar_lost_qty)}</p>
            </div>
          </div>
        </section>

        {invoice.notes && (
          <section className="border-t py-5">
            <h3 className="font-bold">Notes</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm">{invoice.notes}</p>
          </section>
        )}

        <section className="border-t pt-5">
          <h3 className="font-bold">Payment information</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {settings?.bank_name && <p>Bank: {settings.bank_name}</p>}
            {settings?.bank_account_name && <p>Account name: {settings.bank_account_name}</p>}
            {settings?.bank_account_number && <p>Account number: {settings.bank_account_number}</p>}
            {settings?.bank_ifsc && <p>IFSC: {settings.bank_ifsc}</p>}
            {settings?.upi_id && <p className="break-all">UPI ID: {settings.upi_id}</p>}
          </div>
          {settings?.payment_qr_url && (
            <img src={settings.payment_qr_url} alt="Payment QR code" className="mt-4 h-36 w-36 object-contain" />
          )}
          {settings?.invoice_terms && (
            <p className="mt-4 whitespace-pre-wrap text-xs text-slate-600">{settings.invoice_terms}</p>
          )}
        </section>

        <footer className="mt-8 border-t pt-4 text-center text-xs text-slate-500">
          This summary is generated from the saved invoice.
        </footer>
      </article>
    </main>
  );
}
