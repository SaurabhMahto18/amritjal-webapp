
import { BluetoothSerial } from "@ascentio-it/capacitor-bluetooth-serial";
import { Capacitor } from "@capacitor/core";

let connectedAddress = null;

function ensureAndroid() {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android"
  ) {
    throw new Error(
      "Bluetooth Classic printing requires the Android APK."
    );
  }
}

function normalizeDevice(device) {
  const address = device.address || device.id;

  if (!address) return null;

  return {
    id: address,
    address,
    name: device.name || "Bluetooth Printer",
    connectionType: "classic",
  };
}

export async function checkBluetoothPermissions() {
  ensureAndroid();

  const granted =
    await BluetoothSerial.checkBluetoothPermissions();

  return Boolean(granted);
}

export async function enableBluetooth() {
  ensureAndroid();

  const result = await BluetoothSerial.enable();

  if (!result?.enabled) {
    throw new Error("Please enable Bluetooth on your phone.");
  }

  return true;
}

export async function isBluetoothEnabled() {
  ensureAndroid();

  const result = await BluetoothSerial.isEnabled();

  return Boolean(result?.enabled);
}

export async function getPairedClassicPrinters() {
  ensureAndroid();

  await enableBluetooth();

  const result = await BluetoothSerial.getPairedDevices();

  return (result?.devices || [])
    .map(normalizeDevice)
    .filter(Boolean);
}

export async function scanClassicPrinters() {
  ensureAndroid();

  await enableBluetooth();

  const result = await BluetoothSerial.scan();

  return (result?.devices || [])
    .map(normalizeDevice)
    .filter(Boolean);
}

export async function connectClassicPrinter(printer) {
  ensureAndroid();

  const address = printer?.address || printer?.id;

  if (!address) {
    throw new Error("Invalid Bluetooth printer address.");
  }

  await enableBluetooth();

  try {
    await BluetoothSerial.connectInsecure({ address });
  } catch (firstError) {
    try {
      await BluetoothSerial.connect({ address });
    } catch (secondError) {
      throw new Error(
        secondError?.message ||
        firstError?.message ||
        "Could not connect to Bluetooth printer."
      );
    }
  }

  connectedAddress = address;

  return {
    success: true,
    connected: true,
    printer: normalizeDevice(printer),
  };
}

export async function disconnectClassicPrinter() {
  ensureAndroid();

  if (!connectedAddress) {
    return { success: true, connected: false };
  }

  const address = connectedAddress;

  try {
    await BluetoothSerial.disconnect({ address });
  } finally {
    connectedAddress = null;
  }

  return { success: true, connected: false };
}

export async function isClassicPrinterConnected() {
  ensureAndroid();

  if (!connectedAddress) return false;

  try {
    const result = await BluetoothSerial.isConnected({
      address: connectedAddress,
    });

    return Boolean(result?.connected);
  } catch {
    return false;
  }
}

function bytesToPluginString(data) {
  const bytes =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  // Plugin's documented write API accepts a string,
  // not a Uint8Array. Preserve byte values in the
  // JavaScript string before passing them to the plugin.
  let output = "";

  const chunkSize = 4096;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    output += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize)
    );
  }

  return output;
}

export async function writeClassicReceipt(data) {
  ensureAndroid();

  if (!connectedAddress) {
    throw new Error("No Bluetooth Classic printer connected.");
  }

  const connected = await isClassicPrinterConnected();

  if (!connected) {
    connectedAddress = null;
    throw new Error("Bluetooth printer connection was lost.");
  }

  const value = bytesToPluginString(data);

  // Keep chunks small to avoid oversized plugin writes.
  const chunkSize = 512;

  for (let i = 0; i < value.length; i += chunkSize) {
    await BluetoothSerial.write({
      address: connectedAddress,
      value: value.slice(i, i + chunkSize),
    });
  }

  return {
    success: true,
    bytesSent: value.length,
  };
}

export function getConnectedClassicPrinter() {
  return connectedAddress
    ? {
        id: connectedAddress,
        address: connectedAddress,
        name: "Bluetooth Classic Printer",
        connectionType: "classic",
      }
    : null;
}
