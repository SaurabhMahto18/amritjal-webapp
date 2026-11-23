
import {
  getPairedClassicPrinters,
  scanClassicPrinters,
  connectClassicPrinter,
  disconnectClassicPrinter,
  isClassicPrinterConnected,
  writeClassicReceipt,
  enableBluetooth,
} from "./bluetoothClassicService.js";

import {
  scanBlePrinters,
  selectBlePrinter,
  getBlePrinterServices,
  connectBlePrinter,
  disconnectBlePrinter,
  isBlePrinterConnected,
  writeBleReceipt,
} from "./bluetoothBleService.js";

import { sendTcpReceipt } from "./tcpPrinterBridge.js";

const DEFAULT_WIFI_CONFIG = {
  host: "192.168.1.100",
  port: 9100,
  protocol: "escpos",
  paperWidth: "80",
};

let activeConnectionType = null;
let activePrinter = null;
let activeConfig = {};

function getConnectionType(printer) {
  return (
    printer?.connectionType ||
    printer?.type ||
    activeConnectionType
  );
}

function normalizeBytes(data) {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
  }

  if (Array.isArray(data)) {
    return new Uint8Array(data);
  }

  throw new Error("Invalid receipt data format.");
}

// -----------------------------
// PRINTER DISCOVERY
// -----------------------------

export async function getAvailablePrinters() {
  return getPairedClassicPrinters();
}

export async function scanAvailablePrinters() {
  return scanClassicPrinters();
}

export async function getAvailableBlePrinters(options = {}) {
  return scanBlePrinters(options);
}

export async function selectAvailableBlePrinter(config = {}) {
  return selectBlePrinter(config);
}

export async function getBlePrinterCapabilities(deviceId) {
  return getBlePrinterServices(deviceId);
}

export function getDefaultWifiPrinter() {
  return { ...DEFAULT_WIFI_CONFIG };
}

// -----------------------------
// CONNECT PRINTER
// -----------------------------

export async function connectPrinter(printer, config = {}) {
  if (!printer) {
    throw new Error("Please select a printer.");
  }

  const type = getConnectionType(printer);

  if (!type) {
    throw new Error("Unknown printer connection type.");
  }

  if (activeConnectionType) {
    await disconnectPrinter();
  }

  let result;

  if (type === "classic") {
    await enableBluetooth();
    result = await connectClassicPrinter(printer);
  } else if (type === "ble") {
    result = await connectBlePrinter(printer, config);
  } else if (type === "wifi") {
    const host = String(
      config.host || printer.host || DEFAULT_WIFI_CONFIG.host
    ).trim();

    const port = Number(
      config.port || printer.port || DEFAULT_WIFI_CONFIG.port
    );

    if (!host) {
      throw new Error("Wi-Fi printer IP address is required.");
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("Invalid Wi-Fi printer port.");
    }

    result = {
      success: true,
      printer: {
        ...printer,
        name: printer.name || `Wi-Fi Printer (${host})`,
        host,
        port,
        connectionType: "wifi",
      },
    };

    config = {
      ...config,
      host,
      port,
      protocol: config.protocol || "escpos",
      paperWidth: config.paperWidth || "80",
    };
  } else {
    throw new Error(
      "Unsupported printer type. Select Classic, BLE or Wi-Fi."
    );
  }

  activeConnectionType = type;
  activePrinter = result?.printer || printer;
  activeConfig = { ...config };

  return {
    success: true,
    connected: type !== "wifi",
    configured: type === "wifi",
    platform: "android",
    printer: activePrinter,
    connectionType: type,
  };
}

// -----------------------------
// DISCONNECT PRINTER
// -----------------------------

export async function disconnectPrinter() {
  if (activeConnectionType === "classic") {
    await disconnectClassicPrinter();
  } else if (activeConnectionType === "ble") {
    await disconnectBlePrinter();
  }

  // Wi-Fi uses a short-lived TCP socket for each print.
  // No persistent socket needs closing here.

  activeConnectionType = null;
  activePrinter = null;
  activeConfig = {};

  return {
    success: true,
    connected: false,
    configured: false,
  };
}

// -----------------------------
// PRINTER STATUS
// -----------------------------

export async function getPrinterStatus() {
  if (activeConnectionType === "wifi") {
    return {
      connected: false,
      configured: Boolean(
        activeConfig.host && activeConfig.port
      ),
      ready: Boolean(
        activePrinter &&
        activeConfig.host &&
        activeConfig.port
      ),
      platform: "android",
      printer: activePrinter,
      connectionType: "wifi",
      host: activeConfig.host,
      port: activeConfig.port,
    };
  }

  let connected = false;

  if (activeConnectionType === "classic") {
    connected = await isClassicPrinterConnected();
  } else if (activeConnectionType === "ble") {
    connected = await isBlePrinterConnected();
  }

  if (!connected) {
    activeConnectionType = null;
    activePrinter = null;
    activeConfig = {};
  }

  return {
    connected,
    configured: connected,
    ready: connected,
    platform: "android",
    printer: activePrinter,
    connectionType: activeConnectionType,
  };
}

// -----------------------------
// PRINT RECEIPT
// -----------------------------

export async function printReceipt({
  data,
  printer,
  paperWidth = "80",
} = {}) {
  if (!data || !data.length) {
    throw new Error("Receipt data is empty.");
  }

  const status = await getPrinterStatus();

  if (!status.ready) {
    throw new Error("Configure or connect a printer before printing.");
  }

  const type = getConnectionType(printer);
  const bytes = normalizeBytes(data);

  let result;

  if (type === "classic") {
    result = await writeClassicReceipt(bytes);
  } else if (type === "ble") {
    result = await writeBleReceipt(bytes);
  } else if (type === "wifi") {
    if (!activeConfig.host || !activeConfig.port) {
      throw new Error("Wi-Fi printer configuration is missing.");
    }

    result = await sendTcpReceipt({
      host: activeConfig.host,
      port: activeConfig.port,
      data: bytes,
    });
  } else {
    throw new Error("No active printer connection.");
  }

  return {
    success: true,
    printer: activePrinter?.name || "Thermal Printer",
    connectionType: type,
    paperWidth: activeConfig.paperWidth || paperWidth,
    bytesSent: result?.bytesSent ?? bytes.length,
    message: "Receipt data sent to printer.",
  };
}

// -----------------------------
// TEST PRINT
// -----------------------------

export async function testPrinter({
  printer,
  paperWidth = "80",
} = {}) {
  const bytes = new TextEncoder().encode(
    "\x1B\x40" +
    "\x1B\x61\x01" +
    "AMRIT JAL\n" +
    "PRINTER TEST\n" +
    "------------------------------\n" +
    "ESC/POS TEST SUCCESSFUL\n" +
    "Paper: 80mm\n" +
    "\n\n\n" +
    "\x1B\x61\x00"
  );

  return printReceipt({
    data: bytes,
    printer,
    paperWidth,
  });
}

// -----------------------------
// ACTIVE PRINTER
// -----------------------------

export function getActivePrinter() {
  return activePrinter;
}

export function getActivePrinterConfig() {
  return { ...activeConfig };
}

// -----------------------------
// CAPABILITIES
// -----------------------------

export function getPrinterCapabilities() {
  return {
    platform: "android",
    bluetoothClassic: true,
    bluetoothLE: true,
    wifiTCP: true,
    wifiPort: 9100,
    protocol: ["escpos"],
    paperWidths: ["58", "80"],
    windows: false,
  };
}
