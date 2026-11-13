
const isBrowser = typeof window !== "undefined";

function getPlatform() {
  if (!isBrowser) return "unknown";

  const capacitor = window.Capacitor;

  if (capacitor?.isNativePlatform?.()) {
    return capacitor.getPlatform();
  }

  return "web";
}

async function getPrinterAdapter() {
  const platform = getPlatform();

  if (platform === "android") {
    const module = await import("./androidPrinterService.js");
    return module;
  }

  if (platform === "web") {
    const module = await import("./windowsPrinterService.js");
    return module;
  }

  throw new Error(
    `Printing is not supported on platform: ${platform}`
  );
}

export async function getPrinterPlatform() {
  return getPlatform();
}

export async function getAvailablePrinters() {
  const adapter = await getPrinterAdapter();

  if (typeof adapter.getAvailablePrinters !== "function") {
    throw new Error("Printer discovery is not available.");
  }

  return adapter.getAvailablePrinters();
}

export async function connectPrinter(printer) {
  if (!printer) {
    throw new Error("Please select a printer first.");
  }

  const adapter = await getPrinterAdapter();

  if (typeof adapter.connectPrinter !== "function") {
    throw new Error("Printer connection is not supported.");
  }

  return adapter.connectPrinter(printer);
}

export async function disconnectPrinter() {
  const adapter = await getPrinterAdapter();

  if (typeof adapter.disconnectPrinter !== "function") {
    return { success: true };
  }

  return adapter.disconnectPrinter();
}

export async function getPrinterStatus() {
  const adapter = await getPrinterAdapter();

  if (typeof adapter.getPrinterStatus !== "function") {
    return {
      connected: false,
      message: "Printer status is unavailable.",
    };
  }

  return adapter.getPrinterStatus();
}

export async function printReceipt({
  data,
  printer,
  paperWidth = "80",
}) {
  if (!data) {
    throw new Error("Receipt data is required.");
  }

  if (!["58", "80"].includes(String(paperWidth))) {
    throw new Error("Paper width must be 58mm or 80mm.");
  }

  const adapter = await getPrinterAdapter();

  if (typeof adapter.printReceipt !== "function") {
    throw new Error("Printing is not supported by this adapter.");
  }

  return adapter.printReceipt({
    data,
    printer,
    paperWidth: String(paperWidth),
  });
}

export async function getPrinterCapabilities() {
  const platform = getPlatform();

  if (platform === "android") {
    return {
      platform: "android",
      bluetoothClassic: true,
      bluetoothLE: true,
      paperWidths: ["58", "80"],
    };
  }

  if (platform === "web") {
    return {
      platform: "web",
      bluetoothClassic: false,
      bluetoothLE: false,
      qzTray: true,
      paperWidths: ["58", "80"],
    };
  }

  return {
    platform,
    bluetoothClassic: false,
    bluetoothLE: false,
    paperWidths: [],
  };
}
