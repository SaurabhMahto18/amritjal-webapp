
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  Info,
  Printer,
  QrCode,
  UserRound,
  Phone,
  MapPin,
  ExternalLink,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Try fallback below.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function safeFilename(value) {
  return String(value || "customer")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 60);
}

function printQR({
  qrDataUrl,
  businessName,
  customerName,
  customerCode,
  phone,
  address,
}) {
  if (!qrDataUrl) {
    throw new Error("QR code is not ready yet.");
  }

  const printWindow = window.open(
    "",
    "_blank",
    "width=650,height=750"
  );

  if (!printWindow) {
    throw new Error("Please allow pop-ups to print the QR code.");
  }

  const doc = printWindow.document;

  doc.title = `Customer QR - ${customerName}`;

  const style = doc.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 35px 20px;
      background: white;
      color: #24262b;
      font-family: Arial, sans-serif;
      text-align: center;
    }
    .card {
      max-width: 420px;
      margin: 0 auto;
      padding: 28px;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
    }
    h2 { margin: 0 0 8px; font-size: 23px; }
    .subtitle { margin: 0 0 22px; color: #64748b; font-size: 13px; }
    img { width: 240px; height: 240px; object-fit: contain; }
    h3 { margin: 20px 0 8px; font-size: 19px; }
    .detail { margin: 7px 0; font-size: 13px; overflow-wrap: anywhere; }
    .code {
      margin-top: 16px;
      padding: 10px;
      border-radius: 8px;
      background: #f8fafc;
      font-weight: bold;
      letter-spacing: .5px;
    }
    .footer { margin-top: 22px; color: #64748b; font-size: 11px; }
    @media print {
      body { padding: 10px; }
      .card { border: 1px solid #ddd; }
    }
  `;

  doc.head.appendChild(style);

  const card = doc.createElement("main");
  card.className = "card";

  const heading = doc.createElement("h2");
  heading.textContent = businessName;

  const subtitle = doc.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent = "Customer Identification Card";

  const image = doc.createElement("img");
  image.src = qrDataUrl;
  image.alt = "Customer QR Code";

  const name = doc.createElement("h3");
  name.textContent = customerName;

  const code = doc.createElement("p");
  code.className = "detail code";
  code.textContent = `Customer ID: ${customerCode}`;

  const phoneText = doc.createElement("p");
  phoneText.className = "detail";
  phoneText.textContent = `Mobile: ${phone}`;

  const addressText = doc.createElement("p");
  addressText.className = "detail";
  addressText.textContent = address;

  const footer = doc.createElement("p");
  footer.className = "footer";
  footer.textContent = "Scan the QR code to open the customer profile.";

  card.append(
    heading,
    subtitle,
    image,
    name,
    code,
    phoneText,
    addressText,
    footer
  );

  doc.body.replaceChildren(card);

  const startPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  image.onload = startPrint;

  image.onerror = () => {
    printWindow.close();
    throw new Error("Unable to load QR image for printing.");
  };

  if (image.complete && image.naturalWidth > 0) {
    startPrint();
  }
}

export default function CustomerQRSection({
  customer,
  qrImageUrl = "",
  businessName = "Amrit Jal",
}) {
  const [generatedQR, setGeneratedQR] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const customerCode = String(customer?.code || customer?.id || "");
  const customerName = customer?.name || "Customer";
  const phone = customer?.phone || "—";
  const area = customer?.area || "—";
  const address = customer?.address || "—";

  // Generate a QR code containing the actual customer profile URL.
  useEffect(() => {
    let active = true;

    async function generateQR() {
      setGenerating(true);
      setError("");
      setGeneratedQR("");
      setProfileUrl("");

      if (!customer?.id) {
        setError("Customer ID is missing. Cannot generate QR code.");
        setGenerating(false);
        return;
      }

      try {
        const url = `${window.location.origin}/customers/${encodeURIComponent(
          customer.id
        )}`;

        const dataUrl = await QRCode.toDataURL(url, {
          errorCorrectionLevel: "H",
          type: "image/png",
          quality: 1,
          margin: 2,
          width: 640,
          color: {
            dark: "#153C36",
            light: "#FFFFFF",
          },
        });

        if (!active) return;

        setProfileUrl(url);
        setGeneratedQR(dataUrl);
      } catch (err) {
        if (!active) return;

        setError(
          err?.message || "Unable to generate customer QR code."
        );
      } finally {
        if (active) setGenerating(false);
      }
    }

    void generateQR();

    return () => {
      active = false;
    };
  }, [customer?.id]);

  const activeQR = qrImageUrl || generatedQR;

  async function handleCopy(value, type) {
    setActionMessage("");

    if (!value) return;

    const result = await copyText(value);

    if (result) {
      setCopied(type);
      setActionMessage(
        type === "code"
          ? "Customer ID copied."
          : "Customer profile link copied."
      );

      window.setTimeout(() => setCopied(""), 1800);
    } else {
      setCopied("");
      setActionMessage("Could not copy. Please copy it manually.");
    }
  }

  async function handlePrint() {
    setActionMessage("");

    try {
      printQR({
        qrDataUrl: activeQR,
        businessName,
        customerName,
        customerCode,
        phone,
        address:
          address !== "—"
            ? address
            : area !== "—"
              ? area
              : "Address not provided",
      });
    } catch (err) {
      setActionMessage(
        err?.message || "Unable to open print window."
      );
    }
  }

  function handleDownload() {
    if (!activeQR) return;

    const link = document.createElement("a");
    link.href = activeQR;
    link.download = `customer-${safeFilename(customerCode)}-qr.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        <UserRound
          size={28}
          className="mx-auto mb-3 text-slate-300"
          aria-hidden="true"
        />
        Customer information is not available.
      </div>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <QrCode size={22} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Customer QR Code
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Customer identification and quick profile access.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5">
        {/* QR Card - first on mobile */}
        <section className="order-1 flex min-w-0 flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5 lg:order-2">
          <p className="text-sm font-bold text-slate-800">
            Customer QR
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Scan to open customer profile
          </p>

          <div className="mt-4 flex size-56 max-w-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 sm:size-64">
            {generating ? (
              <div className="flex flex-col items-center gap-3">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-teal-700"
                  aria-hidden="true"
                />
                <p className="text-xs text-slate-500">
                  Generating QR code...
                </p>
              </div>
            ) : activeQR ? (
              <img
                src={activeQR}
                alt={`QR code for ${customerName}`}
                className="size-full object-contain"
              />
            ) : (
              <div className="px-4">
                <QrCode
                  size={42}
                  className="mx-auto text-slate-300"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  QR code unavailable
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {error || "Please try again."}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 flex w-full items-start gap-2 rounded-xl bg-rose-50 p-3 text-left text-xs text-rose-700"
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span className="break-words">{error}</span>
            </div>
          )}

          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!activeQR}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <Download size={16} aria-hidden="true" />
              Download
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!activeQR}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <Printer size={16} aria-hidden="true" />
              Print QR
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-slate-400">
            QR contains the customer profile link, not their phone or address.
          </p>
        </section>

        {/* Customer Details */}
        <section className="order-2 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:order-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <UserRound size={23} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-bold text-slate-900">
                {customerName}
              </h3>

              <p className="mt-1 truncate text-xs text-slate-500">
                {businessName} · Customer Profile
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-0 divide-y divide-slate-100 rounded-xl border border-slate-100">
            <div className="flex min-w-0 flex-col gap-1 px-3 py-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
              <span className="shrink-0 text-xs text-slate-500">
                Customer ID
              </span>
              <span className="break-all text-xs font-semibold text-slate-800 min-[390px]:max-w-[65%] min-[390px]:text-right">
                {customerCode || "Not assigned"}
              </span>
            </div>

            <div className="flex min-w-0 flex-col gap-1 px-3 py-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <Phone size={14} aria-hidden="true" />
                Mobile
              </span>

              <span className="break-all text-xs font-semibold text-slate-800 min-[390px]:text-right">
                {phone}
              </span>
            </div>

            <div className="flex min-w-0 flex-col gap-1 px-3 py-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
              <span className="text-xs text-slate-500">
                Area
              </span>

              <span className="break-words text-xs font-semibold text-slate-800 min-[390px]:text-right">
                {area}
              </span>
            </div>

            <div className="flex min-w-0 flex-col gap-1 px-3 py-3 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
              <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                <MapPin size={14} aria-hidden="true" />
                Address
              </span>

              <span className="break-words text-xs font-semibold text-slate-800 min-[390px]:max-w-[65%] min-[390px]:text-right">
                {address}
              </span>
            </div>
          </div>

          {/* Copy actions */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleCopy(customerCode, "code")}
              disabled={!customerCode}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
            >
              {copied === "code" ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {copied === "code" ? "Copied ID" : "Copy Customer ID"}
            </button>

            <button
              type="button"
              onClick={() => handleCopy(profileUrl, "link")}
              disabled={!profileUrl}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
            >
              {copied === "link" ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {copied === "link" ? "Copied Link" : "Copy Profile Link"}
            </button>
          </div>

          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Open Customer Profile
            </a>
          )}

          {actionMessage && (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-center text-xs text-slate-600"
            >
              {actionMessage}
            </p>
          )}
        </section>
      </div>

      {/* Information */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:p-4">
        <Info
          size={19}
          className="mt-0.5 shrink-0 text-blue-700"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-blue-900">
            How Customer QR Works
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800 sm:text-sm">
            Scan this code using a phone camera to open the customer's
            Amrit Jal profile. The user must sign in and have permission
            to access that customer record. The QR does not expose
            customer contact details.
          </p>
        </div>
      </div>
    </section>
  );
}
