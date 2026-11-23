
import { useState } from "react";
import {
  Bluetooth,
  Wifi,
  Printer,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Copy,
  Plug,
  Unplug,
  RefreshCw,
} from "lucide-react";

import {
  connectPrinter,
  connectWifiPrinter,
  disconnectPrinter,
  getPrinterStatus,
  testPrinter,
} from "../services/printer/printerService.js";

import {
  inspectBlePrinter,
} from "../services/printer/blePrinterDiagnostics.js";

const DEFAULT_SETTINGS = {
  connectionType: "ble",
  protocol: "escpos",
  paperWidth: "80",
  host: "192.168.1.100",
  port: "9100",
  chunkSize: "20",
  delayMs: "20",
};

function loadSettings() {
  try {
    const saved = localStorage.getItem("amritjal-printer-settings");

    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function PrinterSettings() {
  const [settings, setSettings] = useState(loadSettings);

  const [printer, setPrinter] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedCharacteristic, setSelectedCharacteristic] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    localStorage.setItem(
      "amritjal-printer-settings",
      JSON.stringify(settings)
    );

    setMessage("Printer settings saved successfully.");
    setError("");
  };

  const inspectPrinter = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setReport(null);
      setPrinter(null);
      setSelectedCharacteristic("");

      const result = await inspectBlePrinter();

      setReport(result);

      setPrinter({
        id: result.printer.deviceId,
        deviceId: result.printer.deviceId,
        name: result.printer.name,
        connectionType: "ble",
      });

      if (result.writableCharacteristics?.length) {
        const first = result.writableCharacteristics[0];

        setSelectedCharacteristic(
          `${first.serviceUUID}|${first.characteristicUUID}`
        );
      } else {
        setError(
          "No writable BLE characteristic found. Check the printer protocol."
        );
      }
    } catch (err) {
      setError(err.message || "BLE inspection failed.");
    } finally {
      setLoading(false);
    }
  };

  const connectBle = async () => {
    if (!printer || !selectedCharacteristic) {
      setError("Inspect a BLE printer and select its writable characteristic first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [serviceUUID, characteristicUUID] =
        selectedCharacteristic.split("|");

      await connectPrinter(printer, {
        serviceUUID,
        characteristicUUID,
        chunkSize: Number(settings.chunkSize),
        delayMs: Number(settings.delayMs),
      });

      setConnected(true);
      setMessage("BLE printer connected successfully.");
    } catch (err) {
      setConnected(false);
      setError(err.message || "BLE connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const connectWifi = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await connectWifiPrinter({
        host: settings.host,
        port: Number(settings.port),
        protocol: settings.protocol,
        paperWidth: settings.paperWidth,
      });

      setPrinter(result.printer || {
        name: `Wi-Fi Printer (${settings.host})`,
        connectionType: "wifi",
        host: settings.host,
        port: Number(settings.port),
      });

      setConnected(false);
      setMessage(
        "Wi-Fi printer configuration saved. Actual connection will be checked during test printing."
      );
    } catch (err) {
      setError(err.message || "Wi-Fi configuration failed.");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setLoading(true);
      await disconnectPrinter();

      setConnected(false);
      setMessage("Printer disconnected.");
    } catch (err) {
      setError(err.message || "Disconnect failed.");
    } finally {
      setLoading(false);
    }
  };

  const runTestPrint = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const status = await getPrinterStatus();

      if (
        settings.connectionType === "ble" &&
        !status.connected
      ) {
        throw new Error("Connect your BLE printer first.");
      }

      if (
        settings.connectionType === "wifi" &&
        !status.configured
      ) {
        throw new Error("Configure your Wi-Fi printer first.");
      }

      const result = await testPrinter({
        printer:
          settings.connectionType === "wifi"
            ? printer
            : undefined,
        paperWidth: settings.paperWidth,
      });

      setMessage(
        `Test print sent successfully. Bytes: ${result.bytesSent ?? "N/A"}`
      );
    } catch (err) {
      setError(err.message || "Test printing failed.");
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

      setMessage("BLE diagnostic report copied.");
    } catch {
      setError("Unable to copy report.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F0] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* HEADER */}
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#E9CA43] p-3 text-[#24262B]">
              <Printer size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#24262B]">
                Printer Settings
              </h1>

              <p className="text-sm text-gray-500">
                Amrit Jal thermal printer configuration
              </p>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        {message && (
          <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 size={19} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* CONNECTION TYPE */}
        <section className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-[#24262B]">
            Connection Type
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSetting("connectionType", "ble")}
              className={`rounded-xl border p-4 text-left ${
                settings.connectionType === "ble"
                  ? "border-[#E9CA43] bg-yellow-50"
                  : "border-gray-200"
              }`}
            >
              <Bluetooth className="mb-2" size={24} />

              <p className="font-semibold">Bluetooth BLE</p>

              <p className="mt-1 text-xs text-gray-500">
                Primary connection
              </p>
            </button>

            <button
              type="button"
              onClick={() => updateSetting("connectionType", "wifi")}
              className={`rounded-xl border p-4 text-left ${
                settings.connectionType === "wifi"
                  ? "border-[#E9CA43] bg-yellow-50"
                  : "border-gray-200"
              }`}
            >
              <Wifi className="mb-2" size={24} />

              <p className="font-semibold">Wi-Fi / LAN</p>

              <p className="mt-1 text-xs text-gray-500">
                Network printing
              </p>
            </button>
          </div>
        </section>

        {/* COMMON SETTINGS */}
        <section className="space-y-4 rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#24262B]">
            Print Configuration
          </h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Printer Protocol
            </label>

            <select
              value={settings.protocol}
              onChange={(e) =>
                updateSetting("protocol", e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-yellow-500"
            >
              <option value="escpos">ESC/POS</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Paper Width
            </label>

            <select
              value={settings.paperWidth}
              onChange={(e) =>
                updateSetting("paperWidth", e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-yellow-500"
            >
              <option value="58">58 mm</option>
              <option value="80">80 mm</option>
            </select>
          </div>
        </section>

        {/* BLE SETTINGS */}
        {settings.connectionType === "ble" && (
          <section className="space-y-4 rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#24262B]">
                Bluetooth Printer
              </h2>

              <Bluetooth size={22} />
            </div>

            <button
              type="button"
              onClick={inspectPrinter}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#24262B] p-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={19} />
              ) : (
                <Search size={19} />
              )}

              {loading
                ? "Inspecting..."
                : "Select & Inspect BLE Printer"}
            </button>

            {printer && (
              <div className="rounded-xl bg-green-50 p-3">
                <p className="text-xs text-gray-500">
                  Selected Printer
                </p>

                <p className="font-semibold text-gray-900">
                  {printer.name}
                </p>

                <p className="break-all text-xs text-gray-500">
                  {printer.deviceId}
                </p>
              </div>
            )}

            {report?.writableCharacteristics?.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Writable Characteristic
                </label>

                <select
                  value={selectedCharacteristic}
                  onChange={(e) =>
                    setSelectedCharacteristic(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm"
                >
                  {report.writableCharacteristics.map((item, index) => (
                    <option
                      key={`${item.serviceUUID}-${item.characteristicUUID}`}
                      value={`${item.serviceUUID}|${item.characteristicUUID}`}
                    >
                      Characteristic {index + 1} —{" "}
                      {item.characteristicUUID}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs text-gray-600">
                  Chunk Size
                </label>

                <input
                  type="number"
                  min="20"
                  value={settings.chunkSize}
                  onChange={(e) =>
                    updateSetting("chunkSize", e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-600">
                  Delay (ms)
                </label>

                <input
                  type="number"
                  min="0"
                  value={settings.delayMs}
                  onChange={(e) =>
                    updateSetting("delayMs", e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-300 p-3"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={connectBle}
              disabled={loading || !selectedCharacteristic || !printer}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
            >
              <Plug size={18} />
              Connect BLE Printer
            </button>
          </section>
        )}

        {/* WIFI SETTINGS */}
        {settings.connectionType === "wifi" && (
          <section className="space-y-4 rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-[#24262B]">
              <Wifi size={22} />
              Wi-Fi Printer
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Printer IP Address
              </label>

              <input
                type="text"
                value={settings.host}
                onChange={(e) =>
                  updateSetting("host", e.target.value)
                }
                placeholder="192.168.1.100"
                className="w-full rounded-xl border border-gray-300 p-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                TCP Port
              </label>

              <input
                type="number"
                value={settings.port}
                onChange={(e) =>
                  updateSetting("port", e.target.value)
                }
                placeholder="9100"
                className="w-full rounded-xl border border-gray-300 p-3"
              />
            </div>

            <button
              type="button"
              onClick={connectWifi}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
            >
              <Wifi size={18} />
              Save Wi-Fi Printer Configuration
            </button>
          </section>
        )}

        {/* CONNECTION ACTIONS */}
        <section className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-[#24262B]">
            Printer Actions
          </h2>

          <div className="space-y-3">
            <button
              type="button"
              onClick={saveSettings}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E9CA43] p-3 font-bold text-[#24262B]"
            >
              <Save size={18} />
              Save Settings
            </button>

            <button
              type="button"
              onClick={runTestPrint}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 p-3 font-semibold text-gray-800 disabled:opacity-50"
            >
              <Printer size={18} />
              Print Test Receipt
            </button>

            <button
              type="button"
              onClick={disconnect}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 p-3 font-semibold text-red-600 disabled:opacity-50"
            >
              <Unplug size={18} />
              Disconnect Printer
            </button>
          </div>

          {connected && settings.connectionType === "ble" && (
            <p className="mt-3 flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 size={17} />
              BLE printer connected
            </p>
          )}
        </section>

        {/* DIAGNOSTIC REPORT */}
        {report && (
          <section className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-[#24262B]">
                BLE Diagnostic Report
              </h2>

              <button
                type="button"
                onClick={copyReport}
                className="flex items-center gap-2 text-sm text-blue-600"
              >
                <Copy size={16} />
                Copy
              </button>
            </div>

            <pre className="max-h-80 overflow-auto rounded-xl bg-gray-100 p-3 text-xs text-gray-800">
              {JSON.stringify(report, null, 2)}
            </pre>
          </section>
        )}

        <p className="text-center text-xs text-gray-500">
          Amrit Jal · Thermal Printer Configuration
        </p>
      </div>
    </div>
  );
}
