
import { Capacitor } from "@capacitor/core";

let adapterPromise = null;

const DEFAULT_WIFI_CONFIG = {
  connectionType: "wifi",
  protocol: "escpos",
  host: "192.168.1.100",
  port: 9100,
  paperWidth: "80",
};

function getPlatform() {
  if (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  ) {
    return "android";
  }

  return "windows";
}

async function getAdapter() {
  const platform = getPlatform();

  if (!adapterPromise) {
    adapterPromise =
      platform === "android"
        ? import("./androidPrinterService.js")
        : import("./windowsPrinterService.js");
  }

  try {
    return await adapterPromise;
  } catch (error) {
    adapterPromise = null;
    throw error;
  }
}

// -----------------------------
// PRINTER DISCOVERY
// -----------------------------

export async function getAvailablePrinters(options = {}) {
  const adapter = await getAdapter();
  return adapter.getAvailablePrinters(options);
}

export async function scanAvailablePrinters(options = {}) {
  const adapter = await getAdapter();

  if (!adapter.scanAvailablePrinters) {
    throw new Error(
      "Classic Bluetooth scanning is available only in Android."
    );
  }

  return adapter.scanAvailablePrinters(options);
}

export async function getAvailableBlePrinters(options = {}) {
  const adapter = await getAdapter();

  if (!adapter.getAvailableBlePrinters) {
    throw new Error(
      "BLE printer scanning is available only in Android."
    );
  }

  return adapter.getAvailableBlePrinters(options);
}

export async function selectAvailableBlePrinter(options = {}) {
  const adapter = await getAdapter();

  if (!adapter.selectAvailableBlePrinter) {
    throw new Error(
      "BLE device selection is available only in Android."
    );
  }

  return adapter.selectAvailableBlePrinter(options);
}

export async function getBlePrinterCapabilities(deviceId) {
  const adapter = await getAdapter();

  if (!adapter.getBlePrinterCapabilities) {
    throw new Error(
      "BLE service inspection is unavailable on this platform."
    );
  }

  return adapter.getBlePrinterCapabilities(deviceId);
}

// -----------------------------
// WIFI PRINTER CONFIGURATION
// -----------------------------

export function getDefaultWifiPrinter() {
  return { ...DEFAULT_WIFI_CONFIG };
}

export async function connectWifiPrinter(config = {}) {
  const adapter = await getAdapter();

  if (!adapter.connectPrinter) {
    throw new Error("Printer connection is unavailable.");
  }

  const wifiConfig = {
    ...DEFAULT_WIFI_CONFIG,
    ...config,
    connectionType: "wifi",
  };

  const printer = {
    name: config.name || `Wi-Fi Printer (${wifiConfig.host})`,
    connectionType: "wifi",
    host: wifiConfig.host,
    port: wifiConfig.port,
    protocol: wifiConfig.protocol,
    paperWidth: wifiConfig.paperWidth,
  };

  return adapter.connectPrinter(printer, wifiConfig);
}

// -----------------------------
// CONNECTION
// -----------------------------

export async function connectPrinter(printer, config = {}) {
  const adapter = await getAdapter();

  return adapter.connectPrinter(printer, config);
}

export async function disconnectPrinter() {
  const adapter = await getAdapter();

  return adapter.disconnectPrinter();
}

export async function getPrinterStatus() {
  const adapter = await getAdapter();

  return adapter.getPrinterStatus();
}

// -----------------------------
// PRINT RECEIPT
// -----------------------------

export async function printReceipt({
  data,
  printer,
  paperWidth = "80",
  options = {},
} = {}) {
  const adapter = await getAdapter();

  return adapter.printReceipt({
    data,
    printer,
    paperWidth,
    options,
  });
}

// -----------------------------
// TEST PRINT
// -----------------------------

export async function testPrinter({
  printer,
  paperWidth = "80",
} = {}) {
  const adapter = await getAdapter();

  if (!adapter.testPrinter) {
    throw new Error("Printer test is not supported.");
  }

  return adapter.testPrinter({
    printer,
    paperWidth,
  });
}

// -----------------------------
// ACTIVE PRINTER
// -----------------------------

export async function getActivePrinter() {
  const adapter = await getAdapter();

  return adapter.getActivePrinter?.() || null;
}

export async function getActivePrinterConfig() {
  const adapter = await getAdapter();

  return adapter.getActivePrinterConfig?.() || {};
}

// -----------------------------
// CAPABILITIES
// -----------------------------

export async function getPrinterCapabilities() {
  const adapter = await getAdapter();

  if (adapter.getPrinterCapabilities) {
    return adapter.getPrinterCapabilities();
  }

  return {
    platform: getPlatform(),
  };
}

// -----------------------------
// RESET
// -----------------------------

export function resetPrinterAdapter() {
  adapterPromise = null;
}
