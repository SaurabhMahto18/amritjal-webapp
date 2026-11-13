
import qz from "qz-tray";

let isConnecting = false;

async function ensureQzConnection() {
  if (qz.websocket.isActive()) {
    return true;
  }

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
        error?.message || ""
      }`
    );
  } finally {
    isConnecting = false;
  }
}

export async function connectPrinter(printer) {
  if (!printer?.name) {
    throw new Error("Please select a Windows printer.");
  }

  await ensureQzConnection();

  const printers = await qz.printers.find();

  if (!printers.includes(printer.name)) {
    throw new Error("Selected printer is not available in Windows.");
  }

  return {
    success: true,
    printer: printer.name,
    connected: true,
  };
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

export async function getPrinterStatus() {
  try {
    const connected = qz.websocket.isActive();

    return {
      connected,
      platform: "windows",
      message: connected
        ? "QZ Tray connected."
        : "QZ Tray is disconnected.",
    };
  } catch (error) {
    return {
      connected: false,
      platform: "windows",
      message: error?.message || "Unable to check printer status.",
    };
  }
}

export async function disconnectPrinter() {
  try {
    if (qz.websocket.isActive()) {
      await qz.websocket.disconnect();
    }

    return { success: true };
  } catch (error) {
    throw new Error(
      `Unable to disconnect QZ Tray: ${error?.message || error}`
    );
  }
}

export async function printReceipt({
  data,
  printer,
  paperWidth = "80",
}) {
  if (!data) {
    throw new Error("Receipt data is missing.");
  }

  if (!printer?.name) {
    throw new Error("Please select a printer before printing.");
  }

  await ensureQzConnection();

  const printers = await qz.printers.find();

  if (!printers.includes(printer.name)) {
    throw new Error("The selected printer is not installed or available.");
  }

  const bytes =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  if (!bytes.length) {
    throw new Error("Receipt contains no printable data.");
  }

  const config = qz.configs.create(printer.name, {
    encoding: "UTF-8",
    copies: 1,
    jobName: "Amrit Jal Invoice",
  });

  const printData = [
    {
      type: "raw",
      format: "command",
      flavor: "plain",
      data: Array.from(bytes),
    },
  ];

  try {
    await qz.print(config, printData);

    return {
      success: true,
      printer: printer.name,
      paperWidth,
      message: "Print job sent to Windows printer.",
    };
  } catch (error) {
    throw new Error(
      `Windows printing failed: ${error?.message || error}`
    );
  }
}
