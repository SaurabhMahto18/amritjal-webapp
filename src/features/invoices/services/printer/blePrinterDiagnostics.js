
import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";

const COMMON_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];

let initialized = false;

async function initialize() {
  if (
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== "android"
  ) {
    throw new Error("BLE inspection requires the Android APK.");
  }

  if (!initialized) {
    await BleClient.initialize({
      androidNeverForLocation: true,
    });
    initialized = true;
  }

  if (!(await BleClient.isEnabled())) {
    await BleClient.requestEnable();
  }
}

function getWritableCharacteristics(services) {
  const result = [];

  for (const service of services || []) {
    for (const characteristic of service.characteristics || []) {
      const properties = characteristic.properties || {};

      if (
        properties.write ||
        properties.writeWithoutResponse
      ) {
        result.push({
          serviceUUID: service.uuid,
          characteristicUUID: characteristic.uuid,
          write: Boolean(properties.write),
          writeWithoutResponse: Boolean(
            properties.writeWithoutResponse
          ),
        });
      }
    }
  }

  return result;
}

export async function inspectBlePrinter() {
  await initialize();

  let deviceId = null;
  let connected = false;

  try {
    // Open Android's BLE device selection dialog.
    const device = await BleClient.requestDevice({
      acceptAllDevices: true,
      optionalServices: COMMON_PRINTER_SERVICES,
    });

    deviceId = device.deviceId;

    console.log("Selected BLE printer:", device);

    await BleClient.connect(deviceId);
    connected = true;

    // Discover all available services and characteristics.
    const services = await BleClient.getServices(deviceId);

    const writableCharacteristics =
      getWritableCharacteristics(services);

    const report = {
      printer: {
        name: device.name || "BLE Thermal Printer",
        deviceId,
      },
      services: services.map((service) => ({
        serviceUUID: service.uuid,
        characteristics: (
          service.characteristics || []
        ).map((characteristic) => ({
          characteristicUUID: characteristic.uuid,
          properties: characteristic.properties || {},
        })),
      })),
      writableCharacteristics,
      recommendedConfiguration:
        writableCharacteristics[0] || null,
    };

    console.log(
      "BLE PRINTER DIAGNOSTIC REPORT:",
      JSON.stringify(report, null, 2)
    );

    return report;
  } finally {
    if (connected && deviceId) {
      try {
        await BleClient.disconnect(deviceId);
      } catch (error) {
        console.warn("BLE disconnect warning:", error);
      }
    }
  }
}
