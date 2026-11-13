
import {
  getPairedClassicPrinters,
  scanClassicPrinters,
  connectClassicPrinter,
  disconnectClassicPrinter,
  isClassicPrinterConnected,
  writeClassicReceipt,
} from "./bluetoothClassicService.js";

import {
  scanBlePrinters,
  connectBlePrinter,
  disconnectBlePrinter,
  isBlePrinterConnected,
  writeBleReceipt,
} from "./bluetoothBleService.js";

let activeConnectionType = null;
let activePrinter = null;

function ensureAndroid() {
  if (!window.Capacitor?.isNativePlatform?.()) {
    throw new Error("Android native printing is not available in this browser.");
  }

  if (window.Capacitor.getPlatform() !== "android") {
    throw new Error("This printer adapter is for Android only.");
  }
}

export async function getAvailablePrinters() {
  ensureAndroid();

  const classicPrinters = await getPairedClassicPrinters();

  return classicPrinters.map((printer) => ({
    ...printer,
    connectionType: "classic",
  }));
}

export async function getAvailableBlePrinter() {
  ensureAndroid();

  return scanBlePrinters();
}

export async function scanAvailablePrinters() {
  ensureAndroid();

  const classicPrinters = await scanClassicPrinters();

  return classicPrinters.map((printer) => ({
    ...printer,
    connectionType: "classic",
  }));
}

export async function connectPrinter(printer, config = {}) {
  ensureAndroid();

  if (!printer) {
    throw new Error("Select a printer first.");
  }

  if (activeConnectionType) {
    await disconnectPrinter();
  }

  const type = printer.connectionType || "classic";

  if (type === "classic") {
    await connectClassicPrinter(printer);
  } else if (type === "ble") {
    await connectBlePrinter(printer, config);
  } else {
    throw new Error(`Unsupported Bluetooth type: ${type}`);
  }

  activeConnectionType = type;
  activePrinter = printer;

  return {
    success: true,
    connected: true,
    printer,
  };
}

export async function disconnectPrinter() {
  ensureAndroid();

  if (!activeConnectionType) {
    return { success: true, connected: false };
  }

  const type = activeConnectionType;

  try {
    if (type === "classic") {
      await disconnectClassicPrinter();
    } else if (type === "ble") {
      await disconnectBlePrinter();
    }
  } finally {
    activeConnectionType = null;
    activePrinter = null;
  }

  return {
    success: true,
    connected: false,
  };
}

export async function getPrinterStatus() {
  ensureAndroid();

  if (!activeConnectionType) {
    return {
      connected: false,
      platform: "android",
      message: "No printer connected.",
    };
  }

  let connected = false;

  if (activeConnectionType === "classic") {
    connected = await isClassicPrinterConnected();
  }

  if (activeConnectionType === "ble") {
    connected = await isBlePrinterConnected();
  }

  if (!connected) {
    activeConnectionType = null;
    activePrinter = null;
  }

  return {
    connected,
    platform: "android",
    connectionType: activeConnectionType,
    printer: activePrinter,
    message: connected
      ? "Printer connected."
      : "Printer disconnected.",
  };
}

export async function printReceipt({
  data,
  printer,
  paperWidth = "80",
}) {
  ensureAndroid();

  if (!activeConnectionType || !activePrinter) {
    throw new Error("Connect a printer before printing.");
  }

  if (
    printer?.id &&
    activePrinter?.id &&
    printer.id !== activePrinter.id
  ) {
    throw new Error("The selected printer is not the connected printer.");
  }

  if (!["58", "80"].includes(String(paperWidth))) {
    throw new Error("Paper width must be 58mm or 80mm.");
  }

  let result;

  if (activeConnectionType === "classic") {
    result = await writeClassicReceipt(data);
  } else if (activeConnectionType === "ble") {
    result = await writeBleReceipt(data);
  } else {
    throw new Error("Unknown printer connection.");
  }

  return {
    ...result,
    success: true,
    printer: activePrinter,
    paperWidth,
  };
}
