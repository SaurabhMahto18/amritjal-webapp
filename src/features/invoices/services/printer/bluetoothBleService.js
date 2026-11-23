
import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";

let initialized = false;
let connectedDeviceId = null;
let activePrinterConfig = null;
let activeCharacteristic = null;
let disconnecting = false;

const COMMON_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];

function ensureAndroid() {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android"
  ) {
    throw new Error("BLE printing requires the Android APK.");
  }
}

function normalizeUuid(uuid) {
  return String(uuid || "").toLowerCase();
}

function clearConnectionState() {
  connectedDeviceId = null;
  activePrinterConfig = null;
  activeCharacteristic = null;
}

export async function initializeBle() {
  ensureAndroid();

  if (initialized) return true;

  await BleClient.initialize({
    androidNeverForLocation: true,
  });

  initialized = true;
  return true;
}

export async function isBleEnabled() {
  await initializeBle();
  return BleClient.isEnabled();
}

export async function enableBle() {
  await initializeBle();

  const enabled = await BleClient.isEnabled();

  if (!enabled) {
    await BleClient.requestEnable();
  }

  return true;
}

// -----------------------------
// SELECT BLE PRINTER
// -----------------------------

export async function selectBlePrinter(config = {}) {
  await enableBle();

  const optionalServices = [
    ...new Set([
      ...COMMON_PRINTER_SERVICES,
      ...(config.optionalServices || []),
    ]),
  ];

  const device = await BleClient.requestDevice({
    optionalServices,
    ...(config.namePrefix
      ? { namePrefix: config.namePrefix }
      : {}),
  });

  return {
    id: device.deviceId,
    deviceId: device.deviceId,
    name: device.name || "BLE Thermal Printer",
    connectionType: "ble",
    optionalServices,
  };
}

// -----------------------------
// SCAN BLE PRINTERS
// -----------------------------

export async function scanBlePrinters({
  services = [],
  duration = 7000,
  namePrefix,
} = {}) {
  await enableBle();

  const discovered = new Map();

  const scanOptions = {
    ...(services.length ? { services } : {}),
    ...(namePrefix ? { namePrefix } : {}),
    allowDuplicates: true,
  };

  try {
    await BleClient.requestLEScan(
      scanOptions,
      (result) => {
        const device = result?.device;

        if (!device?.deviceId) return;

        discovered.set(device.deviceId, {
          id: device.deviceId,
          deviceId: device.deviceId,
          name:
            device.name ||
            result.localName ||
            "BLE Thermal Printer",
          rssi: result.rssi,
          connectionType: "ble",
        });
      }
    );

    await new Promise((resolve) => {
      setTimeout(resolve, Math.max(1000, duration));
    });

    return [...discovered.values()];
  } finally {
    try {
      await BleClient.stopLEScan();
    } catch {
      // Ignore scan cleanup errors.
    }
  }
}

// -----------------------------
// SERVICE DISCOVERY
// -----------------------------

export async function getBlePrinterServices(deviceId) {
  await initializeBle();

  if (!deviceId) {
    throw new Error("BLE device ID is missing.");
  }

  return BleClient.getServices(deviceId);
}

function findWritableCharacteristic(
  services,
  preferredService,
  preferredCharacteristic
) {
  const normalizedService = normalizeUuid(preferredService);
  const normalizedCharacteristic =
    normalizeUuid(preferredCharacteristic);

  for (const service of services || []) {
    const serviceUuid = normalizeUuid(service.uuid);

    for (const characteristic of service.characteristics || []) {
      const characteristicUuid = normalizeUuid(
        characteristic.uuid
      );

      const properties = characteristic.properties || {};

      const canWrite = Boolean(properties.write);
      const canWriteWithoutResponse = Boolean(
        properties.writeWithoutResponse
      );

      if (!canWrite && !canWriteWithoutResponse) continue;

      if (
        normalizedService &&
        serviceUuid !== normalizedService
      ) {
        continue;
      }

      if (
        normalizedCharacteristic &&
        characteristicUuid !== normalizedCharacteristic
      ) {
        continue;
      }

      return {
        service: service.uuid,
        characteristic: characteristic.uuid,
        write: canWrite,
        writeWithoutResponse: canWriteWithoutResponse,
      };
    }
  }

  return null;
}

// -----------------------------
// CONNECT BLE PRINTER
// -----------------------------

export async function connectBlePrinter(printer, config = {}) {
  await enableBle();

  const deviceId = printer?.deviceId || printer?.id;

  if (!deviceId) {
    throw new Error("BLE device ID is missing.");
  }

  if (connectedDeviceId) {
    await disconnectBlePrinter();
  }

  await BleClient.connect(deviceId, () => {
    if (connectedDeviceId === deviceId && !disconnecting) {
      clearConnectionState();
    }
  });

  try {
    const services = await getBlePrinterServices(deviceId);

    const characteristic = findWritableCharacteristic(
      services,
      config.serviceUUID,
      config.characteristicUUID
    );

    if (!characteristic) {
      throw new Error(
        "No writable BLE characteristic found. Inspect printer services and configure its actual serviceUUID and characteristicUUID."
      );
    }

    let mtuPayload = 20;

    try {
      const mtu = await BleClient.getMtu(deviceId);

      if (Number.isFinite(mtu) && mtu > 3) {
        mtuPayload = mtu - 3;
      }
    } catch {
      // Safe default ATT payload.
    }

    const requestedChunkSize = Number(config.chunkSize);

    const chunkSize =
      Number.isFinite(requestedChunkSize) &&
      requestedChunkSize >= 20
        ? Math.min(requestedChunkSize, mtuPayload)
        : mtuPayload;

    connectedDeviceId = deviceId;
    activeCharacteristic = characteristic;

    activePrinterConfig = {
      ...config,
      chunkSize: Math.max(20, chunkSize),
      delayMs: Math.max(
        0,
        Number(config.delayMs ?? 20)
      ),
    };

    return {
      success: true,
      connected: true,
      printer: {
        ...printer,
        id: deviceId,
        deviceId,
        connectionType: "ble",
      },
      characteristic,
      chunkSize: activePrinterConfig.chunkSize,
    };
  } catch (error) {
    try {
      await BleClient.disconnect(deviceId);
    } catch {
      // Ignore cleanup error.
    }

    clearConnectionState();
    throw error;
  }
}

// -----------------------------
// DISCONNECT
// -----------------------------

export async function disconnectBlePrinter() {
  if (!connectedDeviceId) {
    clearConnectionState();

    return {
      success: true,
      connected: false,
    };
  }

  const deviceId = connectedDeviceId;

  disconnecting = true;

  try {
    await BleClient.disconnect(deviceId);
  } finally {
    clearConnectionState();
    disconnecting = false;
  }

  return {
    success: true,
    connected: false,
  };
}

// -----------------------------
// CONNECTION STATUS
// -----------------------------

export async function isBlePrinterConnected() {
  return Boolean(
    connectedDeviceId && activeCharacteristic
  );
}

export function getConnectedBlePrinter() {
  if (!connectedDeviceId) return null;

  return {
    id: connectedDeviceId,
    deviceId: connectedDeviceId,
    connectionType: "ble",
  };
}

// -----------------------------
// BYTE CONVERSION
// -----------------------------

function toDataView(bytes) {
  const copy = Uint8Array.from(bytes);

  return new DataView(
    copy.buffer,
    copy.byteOffset,
    copy.byteLength
  );
}

// -----------------------------
// WRITE RECEIPT
// -----------------------------

export async function writeBleReceipt(data) {
  if (!connectedDeviceId || !activeCharacteristic) {
    throw new Error("No BLE printer connected.");
  }

  const bytes =
    data instanceof Uint8Array
      ? data
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : ArrayBuffer.isView(data)
          ? new Uint8Array(
              data.buffer,
              data.byteOffset,
              data.byteLength
            )
          : new Uint8Array(data);

  if (!bytes.length) {
    throw new Error("Receipt data is empty.");
  }

  const deviceId = connectedDeviceId;
  const characteristic = activeCharacteristic;

  const {
    chunkSize = 20,
    delayMs = 20,
  } = activePrinterConfig || {};

  let bytesSent = 0;

  for (
    let offset = 0;
    offset < bytes.length;
    offset += chunkSize
  ) {
    if (connectedDeviceId !== deviceId) {
      throw new Error("BLE printer disconnected during printing.");
    }

    const chunk = bytes.slice(
      offset,
      Math.min(offset + chunkSize, bytes.length)
    );

    const view = toDataView(chunk);

    if (characteristic.writeWithoutResponse) {
      await BleClient.writeWithoutResponse(
        deviceId,
        characteristic.service,
        characteristic.characteristic,
        view
      );
    } else if (characteristic.write) {
      await BleClient.write(
        deviceId,
        characteristic.service,
        characteristic.characteristic,
        view
      );
    } else {
      throw new Error(
        "Selected BLE characteristic does not support writing."
      );
    }

    bytesSent += chunk.length;

    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  return {
    success: true,
    bytesSent,
  };
}
