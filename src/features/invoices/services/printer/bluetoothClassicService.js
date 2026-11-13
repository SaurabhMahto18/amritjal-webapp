
import { BluetoothSerial } from "@ascentio-it/capacitor-bluetooth-serial";

let connectedAddress = null;

function ensureAndroid() {
  if (!window.Capacitor?.isNativePlatform?.()) {
    throw new Error(
      "Bluetooth Classic printing requires the Amrit Jal Android app."
    );
  }

  if (window.Capacitor.getPlatform() !== "android") {
    throw new Error("Bluetooth Classic is currently configured for Android.");
  }
}

function normalizeDevice(device) {
  return {
    id: device.address || device.id,
    address: device.address || device.id,
    name: device.name || "Bluetooth Printer",
    connectionType: "classic",
  };
}

export async function checkBluetoothPermissions() {
  ensureAndroid();

  const granted = await BluetoothSerial.checkBluetoothPermissions();

  if (!granted) {
    throw new Error(
      "Bluetooth permission is required. Please allow Bluetooth access."
    );
  }

  return true;
}

export async function isBluetoothEnabled() {
  ensureAndroid();

  return BluetoothSerial.isEnabled();
}

export async function getPairedClassicPrinters() {
  ensureAndroid();
  await checkBluetoothPermissions();

  const result = await BluetoothSerial.getPairedDevices();

  const devices = Array.isArray(result)
    ? result
    : result?.devices || [];

  return devices.map(normalizeDevice);
}

export async function scanClassicPrinters() {
  ensureAndroid();
  await checkBluetoothPermissions();

  const result = await BluetoothSerial.scan();

  const devices = result?.devices || [];

  return devices.map(normalizeDevice);
}

export async function connectClassicPrinter(printer) {
  ensureAndroid();
  await checkBluetoothPermissions();

  const address = printer?.address || printer?.id;

  if (!address) {
    throw new Error("Bluetooth printer address is missing.");
  }

  try {
    await BluetoothSerial.connectInsecure({ address });
  } catch (firstError) {
    // Retry with normal authenticated connection.
    try {
      await BluetoothSerial.connect({ address });
    } catch (secondError) {
      throw new Error(
        `Could not connect to ${printer?.name || "printer"}: ${
          secondError?.message || firstError?.message || "Connection failed"
        }`
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

    return Boolean(result?.connected ?? result);
  } catch {
    return false;
  }
}

function bytesToBinaryString(bytes) {
  let result = "";
  const chunkSize = 512;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }

  return result;
}

export async function writeClassicReceipt(data) {
  ensureAndroid();

  if (!connectedAddress) {
    throw new Error("Connect a Bluetooth Classic printer first.");
  }

  const bytes =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  if (!bytes.length) {
    throw new Error("No receipt data to print.");
  }

  // This serial plugin accepts a string. This conversion is suitable
  // for basic ASCII ESC/POS commands. Arbitrary binary raster images
  // require a native byte-array write implementation.
  const value = bytesToBinaryString(bytes);

  await BluetoothSerial.write({
    address: connectedAddress,
    value,
  });

  return {
    success: true,
    message: "Receipt data sent to Bluetooth Classic printer.",
  };
}
