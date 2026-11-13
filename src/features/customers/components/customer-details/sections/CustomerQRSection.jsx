
import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  Info,
  Printer,
  QrCode,
  UserRound,
} from "lucide-react";

export default function CustomerQRSection({
  customer,
  qrImageUrl = "",
  businessName = "Amrit Jal",
}) {
  const [copied, setCopied] = useState(false);

  if (!customer) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Customer information is not available.
      </div>
    );
  }

  const customerCode = String(customer.code || customer.id || "");
  const customerName = customer.name || "Customer";
  const phone = customer.phone || "—";
  const address = customer.address || "—";

  async function copyCustomerCode() {
    if (!customerCode || !navigator.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(customerCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function printCustomerQR() {
    if (!qrImageUrl) return;

    const printWindow = window.open("", "_blank", "width=600,height=700");
    if (!printWindow) return;

    const safe = (value) =>
      String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return entities[character];
      });

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Customer QR - ${safe(customerName)}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 32px; color: #24262b; }
            img { width: 240px; height: 240px; object-fit: contain; }
            p { margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>${safe(businessName)}</h2>
          <img src="${safe(qrImageUrl)}" alt="Customer QR Code" />
          <h3>${safe(customerName)}</h3>
          <p>Customer ID: ${safe(customerCode)}</p>
          <p>Mobile: ${safe(phone)}</p>
          <p>${safe(address)}</p>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <QrCode size={22} />
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            Customer QR Code
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Customer identification and quick access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <UserRound size={23} />
            </div>

            <div className="min-w-0">
              <h4 className="truncate font-semibold text-slate-900">
                {customerName}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {businessName} · Customer Profile
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-100">
            <div className="flex justify-between gap-4 px-3 py-3 text-sm">
              <span className="text-slate-500">Customer ID</span>
              <span className="break-all text-right font-medium text-slate-800">
                {customerCode || "Not assigned"}
              </span>
            </div>

            <div className="flex justify-between gap-4 px-3 py-3 text-sm">
              <span className="text-slate-500">Mobile</span>
              <span className="text-right font-medium text-slate-800">
                {phone}
              </span>
            </div>

            <div className="flex justify-between gap-4 px-3 py-3 text-sm">
              <span className="text-slate-500">Area</span>
              <span className="text-right font-medium text-slate-800">
                {customer.area || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-4 px-3 py-3 text-sm">
              <span className="text-slate-500">Address</span>
              <span className="max-w-[65%] text-right font-medium text-slate-800">
                {address}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyCustomerCode}
              disabled={!customerCode}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy Customer ID"}
            </button>

            {qrImageUrl && (
              <>
                <a
                  href={qrImageUrl}
                  download={`customer-${customerCode || "qr"}.png`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download size={16} />
                  Download QR
                </a>

                <button
                  type="button"
                  onClick={printCustomerQR}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Printer size={16} />
                  Print
                </button>
              </>
            )}
          </div>
        </section>

        <section className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center">
          <p className="mb-4 text-sm font-semibold text-slate-800">
            Customer QR
          </p>

          {qrImageUrl ? (
            <img
              src={qrImageUrl}
              alt={`QR code for ${customerName}`}
              className="size-52 rounded-lg border border-slate-100 object-contain p-2"
            />
          ) : (
            <div className="flex size-52 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-5">
              <QrCode size={48} className="text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">
                QR code not generated
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Connect a QR generation service to display the actual code.
              </p>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Scan to identify this customer.
          </p>
        </section>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
        <p className="text-xs leading-5 text-blue-700">
          QR generation and customer lookup are not connected here.
          Pass a valid QR image URL through the qrImageUrl prop after
          implementing the QR generation and lookup flow.
        </p>
      </div>
    </div>
  );
}
