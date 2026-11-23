
import qz from "qz-tray";

let isConnecting = false;
let selectedPrinterName = null;

async function ensureQzConnection() {
  if (qz.websocket.isActive()) return true;

  if (isConnecting) {
    throw new Error("QZ Tray connection is already in progress.");
  }

  isConnecting = true;

  try {
    await qz.websocket.connect();
    return true;
  } catch (error) {
    throw new Error(
      `QZ Tray connection failed. Make sure QZ Tray is installed and running. ${
        error?.message || error
      }`
    );
  } finally {
    isConnecting = false;
  }
}

function normalizePrinterName(printer) {
  return typeof printer === "string"
    ? printer
    : printer?.name;
}

function normalizeBytes(data) {
  if (data instanceof Uint8Array) return data;

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

  throw new Error("Invalid receipt data.");
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getAvailablePrinters() {
  await ensureQzConnection();

  const printers = await qz.printers.find();

  return printers.map((name) => ({
    id: name,
    name,
    connectionType: "windows",
  }));
}

export async function connectPrinter(printer) {
  const name = normalizePrinterName(printer);

  if (!name) {
    throw new Error("Please select a Windows printer.");
  }

  await ensureQzConnection();

  const printers = await qz.printers.find();

  if (!printers.includes(name)) {
    throw new Error("Selected printer is not available.");
  }

  selectedPrinterName = name;

  return {
    success: true,
    connected: true,
    printer: {
      id: name,
      name,
      connectionType: "windows",
    },
  };
}

export async function getPrinterStatus() {
  const connected = qz.websocket.isActive();

  return {
    connected,
    platform: "windows",
    printer: selectedPrinterName,
    message: connected
      ? "QZ Tray connected."
      : "QZ Tray disconnected.",
  };
}

export async function disconnectPrinter() {
  selectedPrinterName = null;

  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }

  return {
    success: true,
    connected: false,
  };
}

export async function printReceipt({
  data,
  printer,
  paperWidth = "80",
} = {}) {
  const printerName =
    normalizePrinterName(printer) ||
    selectedPrinterName;

  if (!printerName) {
    throw new Error("Select a Windows printer first.");
  }

  const bytes = normalizeBytes(data);

  if (!bytes.length) {
    throw new Error("Receipt data is empty.");
  }

  await ensureQzConnection();

  const printers = await qz.printers.find();

  if (!printers.includes(printerName)) {
    throw new Error("Selected printer is unavailable.");
  }

  const config = qz.configs.create(printerName, {
    copies: 1,
    jobName: "Amrit Jal Invoice",
  });

  const printData = [
    {
      type: "raw",
      format: "command",
      flavor: "hex",
      data: bytesToHex(bytes),
    },
  ];

  try {
    await qz.print(config, printData);

    selectedPrinterName = printerName;

    return {
      success: true,
      printer: printerName,
      paperWidth,
      message: "Print job sent to Windows printer.",
    };
  } catch (error) {
    throw new Error(
      `Windows printing failed: ${error?.message || error}`
    );
  }
}

export async function testPrinter({
  printer,
  paperWidth = "80",
} = {}) {
  const bytes = new TextEncoder().encode(
    "AMRIT JAL\nPRINTER TEST\nConnection successful\n\n\n"
  );

  return printReceipt({
    data: bytes,
    printer,
    paperWidth,
  });
}
