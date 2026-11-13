
import { BleClient } from "@capacitor-community/bluetooth-le";

let initialized = false;
let connectedDeviceId = null;
let activePrinterConfig = null;

export async function initializeBle() {
  if (!window.Capacitor?.isNativePlatform?.()) {
    throw new Error("BLE printing requires the Android app.");
  }

  if (window.Capacitor.getPlatform() !== "android") {
    throw new Error("This BLE service is configured for Android.");
  }

  if (!initialized) {
    await BleClient.initialize({
      androidNeverForLocation: true,
    });

    initialized = true;
  }

  const enabled = await BleClient.isEnabled();

  if (!enabled) {
    await BleClient.requestEnable();
  }

  return true;
}

export async function scanBlePrinters({
  services = [],
  namePrefix,
} = {}) {
  await initializeBle();

  const options = {};

  if (services.length) {
    options.services = services;
  }

  const device = await BleClient.requestDevice(options);

  if (!device) {
    throw new Error("No BLE printer selected.");
  }

  if (
    namePrefix &&
    device.name &&
    !device.name.toLowerCase().startsWith(namePrefix.toLowerCase())
  ) {
    throw new Error("Selected device does not match the printer name filter.");
  }

  return {
    id: device.deviceId,
    name: device.name || "BLE Printer",
    connectionType: "ble",
  };
}

export async function connectBlePrinter(printer, config = {}) {
  await initializeBle();

  const deviceId = printer?.id || printer?.deviceId;

  if (!deviceId) {
    throw new Error("BLE printer device ID is missing.");
  }

  if (!config.serviceUUID || !config.characteristicUUID) {
    throw new Error(
      "BLE service UUID and write characteristic UUID are required."
    );
  }

  try {
    await BleClient.connect(deviceId);
  } catch (error) {
    throw new Error(
      `BLE connection failed: ${error?.message || error}`
    );
  }

  connectedDeviceId = deviceId;

  activePrinterConfig = {
    serviceUUID: config.serviceUUID,
    characteristicUUID: config.characteristicUUID,
    writeWithoutResponse: config.writeWithoutResponse ?? true,
    chunkSize: config.chunkSize || 180,
    delayMs: config.delayMs ?? 20,
  };

  return {
    success: true,
    connected: true,
    printer: {
      ...printer,
      connectionType: "ble",
    },
  };
}

export async function disconnectBlePrinter() {
  if (!connectedDeviceId) {
    return { success: true, connected: false };
  }

  const deviceId = connectedDeviceId;

  try {
    await BleClient.disconnect(deviceId);
  } finally {
    connectedDeviceId = null;
    activePrinterConfig = null;
  }

  return { success: true, connected: false };
}

export async function isBlePrinterConnected() {
  return Boolean(connectedDeviceId);
}

function toDataView(bytes) {
  const copy = new Uint8Array(bytes);

  return new DataView(
    copy.buffer,
    copy.byteOffset,
    copy.byteLength
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function writeBleReceipt(data) {
  if (!connectedDeviceId || !activePrinterConfig) {
    throw new Error("Connect a BLE printer before printing.");
  }

  const bytes =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  if (!bytes.length) {
    throw new Error("No receipt data to print.");
  }

  const {
    serviceUUID,
    characteristicUUID,
    writeWithoutResponse,
    chunkSize,
    delayMs,
  } = activePrinterConfig;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.slice(offset, offset + chunkSize);
    const value = toDataView(chunk);

    if (writeWithoutResponse) {
      await BleClient.writeWithoutResponse(
        connectedDeviceId,
        serviceUUID,
        characteristicUUID,
        value
      );
    } else {
      await BleClient.write(
        connectedDeviceId,
        serviceUUID,
        characteristicUUID,
        value
      );
    }

    if (delayMs > 0) {
      await wait(delayMs);
    }
  }

  return {
    success: true,
    bytesSent: bytes.length,
    message: "Receipt data sent to BLE printer.",
  };
}
