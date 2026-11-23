
import { registerPlugin, Capacitor } from "@capacitor/core";

const TcpPrinter = registerPlugin("TcpPrinter");

/**
 * Convert ESC/POS byte data into Base64.
 * Preserves binary printer commands.
 */
function bytesToBase64(input) {
  let bytes;

  if (input instanceof Uint8Array) {
    bytes = input;
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else if (ArrayBuffer.isView(input)) {
    bytes = new Uint8Array(
      input.buffer,
      input.byteOffset,
      input.byteLength
    );
  } else if (Array.isArray(input)) {
    bytes = new Uint8Array(input);
  } else {
    throw new Error("Invalid printer data format.");
  }

  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize)
    );
  }

  return btoa(binary);
}

/**
 * Send raw ESC/POS bytes to an Android Wi-Fi printer.
 */
export async function sendTcpReceipt({
  host = "192.168.1.100",
  port = 9100,
  data,
} = {}) {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android"
  ) {
    throw new Error(
      "Wi-Fi TCP printing is available only in the Android APK."
    );
  }

  if (!host || typeof host !== "string") {
    throw new Error("Printer IP address is required.");
  }

  const validPort = Number(port);

  if (
    !Number.isInteger(validPort) ||
    validPort < 1 ||
    validPort > 65535
  ) {
    throw new Error("Invalid printer port.");
  }

  if (!data || !data.length) {
    throw new Error("Receipt data is empty.");
  }

  const base64Data = bytesToBase64(data);

  try {
    const result = await TcpPrinter.send({
      host: host.trim(),
      port: validPort,
      data: base64Data,
    });

    if (!result?.success) {
      throw new Error("Printer did not confirm the send operation.");
    }

    return result;
  } catch (error) {
    throw new Error(
      `Wi-Fi printer error: ${error.message || "Connection failed"}`
    );
  }
}

/**
 * Default Amrit Jal Wi-Fi printer configuration.
 */
export function getWifiPrinterConfig() {
  return {
    connectionType: "wifi",
    protocol: "escpos",
    host: "192.168.1.100",
    port: 9100,
    paperWidth: "80",
  };
}
