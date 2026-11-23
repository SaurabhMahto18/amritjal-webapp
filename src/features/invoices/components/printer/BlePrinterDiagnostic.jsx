
import { useState } from "react";
import {
  Bluetooth,
  Search,
  Copy,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Printer,
  RefreshCw,
} from "lucide-react";

import { inspectBlePrinter } from "../../services/printer/blePrinterDiagnostics.js";

export default function BlePrinterDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleInspect = async () => {
    setLoading(true);
    setError("");
    setReport(null);
    setCopied(false);

    try {
      const result = await inspectBlePrinter();
      setReport(result);
    } catch (err) {
      console.error("BLE diagnostic error:", err);

      setError(
        err?.message ||
        "Unable to inspect BLE printer. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyReport = async () => {
    if (!report) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(report, null, 2)
      );

      setCopied(true);
    } catch {
      setError("Unable to copy report. Please copy the JSON manually.");
    }
  };

  const writable = report?.writableCharacteristics || [];

  return (
    <div className="w-full space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">

      {/* HEADER */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Bluetooth size={25} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900">
            BLE Printer Diagnostics
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Discover your thermal printer's Bluetooth
            service and writable characteristic UUIDs.
          </p>
        </div>
      </div>

      {/* CONFIGURATION */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs text-gray-500">
            Protocol
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            ESC/POS
          </p>
        </div>

        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs text-gray-500">
            Paper Width
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            80 mm
          </p>
        </div>
      </div>

      {/* SCAN BUTTON */}
      <button
        type="button"
        onClick={handleInspect}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <LoaderCircle className="animate-spin" size={19} />
            Inspecting Printer...
          </>
        ) : (
          <>
            <Search size={19} />
            Select & Inspect BLE Printer
          </>
        )}
      </button>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* RESULT */}
      {report && (
        <div className="space-y-4">

          {/* PRINTER DETAILS */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} />
              <span className="font-semibold">
                Printer inspected
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Printer size={25} className="text-gray-600" />

              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {report.printer?.name}
                </p>

                <p className="break-all text-xs text-gray-500">
                  {report.printer?.deviceId}
                </p>
              </div>
            </div>
          </div>

          {/* CHARACTERISTIC COUNT */}
          <div className="rounded-xl border border-stone-200 p-4">
            <p className="text-sm text-gray-500">
              Writable characteristics discovered
            </p>

            <p className="mt-1 text-3xl font-bold text-gray-900">
              {writable.length}
            </p>
          </div>

          {/* WRITABLE CHARACTERISTICS */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              Writable Characteristics
            </h3>

            {writable.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                No writable characteristic found.
                This printer may use a proprietary BLE protocol
                or a different connection type.
              </div>
            ) : (
              writable.map((item, index) => (
                <div
                  key={`${item.serviceUUID}-${item.characteristicUUID}`}
                  className="space-y-2 rounded-xl border border-stone-200 p-3"
                >
                  <p className="text-xs font-semibold text-gray-500">
                    CHARACTERISTIC {index + 1}
                  </p>

                  <div>
                    <p className="text-xs text-gray-500">
                      Service UUID
                    </p>

                    <p className="break-all text-sm font-medium text-gray-900">
                      {item.serviceUUID}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Characteristic UUID
                    </p>

                    <p className="break-all text-sm font-medium text-gray-900">
                      {item.characteristicUUID}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${
                      item.write
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      Write: {item.write ? "Yes" : "No"}
                    </span>

                    <span className={`rounded-full px-2.5 py-1 text-xs ${
                      item.writeWithoutResponse
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      Write Without Response: {
                        item.writeWithoutResponse ? "Yes" : "No"
                      }
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* COMPLETE SERVICES */}
          <details className="rounded-xl border border-stone-200 p-3">
            <summary className="cursor-pointer font-semibold text-gray-800">
              View all BLE services
            </summary>

            <div className="mt-3 space-y-3">
              {report.services?.map((service, index) => (
                <div
                  key={`${service.serviceUUID}-${index}`}
                  className="rounded-lg bg-stone-50 p-3"
                >
                  <p className="text-xs text-gray-500">
                    SERVICE UUID
                  </p>

                  <p className="break-all text-sm font-medium">
                    {service.serviceUUID}
                  </p>

                  {service.characteristics?.map((characteristic, i) => (
                    <div key={i} className="mt-3 border-t border-stone-200 pt-2">
                      <p className="text-xs text-gray-500">
                        Characteristic UUID
                      </p>

                      <p className="break-all text-sm">
                        {characteristic.characteristicUUID}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Properties: {
                          Object.entries(characteristic.properties || {})
                            .filter(([, value]) => value)
                            .map(([key]) => key)
                            .join(", ") || "None reported"
                        }
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>

          {/* COPY REPORT */}
          <button
            type="button"
            onClick={copyReport}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-3 font-semibold text-gray-800 hover:bg-stone-50"
          >
            {copied ? (
              <>
                <CheckCircle2 size={18} />
                Report Copied
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Complete Diagnostic Report
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleInspect}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Inspect Another Printer
          </button>
        </div>
      )}

      <p className="text-xs leading-5 text-gray-500">
        Diagnostic mode only discovers BLE services and
        characteristics. It does not send a print command
        or modify your printer settings.
      </p>
    </div>
  );
}
