
const STORAGE_KEY = "amritjal.printer.settings";

export const DEFAULT_PRINTER_SETTINGS = {
  connectionType: "ble",
  protocol: "escpos",
  paperWidth: "80",

  ble: {
    deviceId: "",
    name: "",
    serviceUUID: "",
    characteristicUUID: "",
    chunkSize: 20,
    delayMs: 20,
    writeWithoutResponse: false,
  },

  wifi: {
    host: "192.168.1.100",
    port: 9100,
  },

  classic: {
    address: "",
    name: "",
  },
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getPrinterSettings() {
  if (!isBrowser()) {
    return structuredClone(DEFAULT_PRINTER_SETTINGS);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(DEFAULT_PRINTER_SETTINGS);
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_PRINTER_SETTINGS,
      ...parsed,
      ble: {
        ...DEFAULT_PRINTER_SETTINGS.ble,
        ...parsed.ble,
      },
      wifi: {
        ...DEFAULT_PRINTER_SETTINGS.wifi,
        ...parsed.wifi,
      },
      classic: {
        ...DEFAULT_PRINTER_SETTINGS.classic,
        ...parsed.classic,
      },
    };
  } catch {
    return structuredClone(DEFAULT_PRINTER_SETTINGS);
  }
}

export function savePrinterSettings(updates = {}) {
  const current = getPrinterSettings();

  const next = {
    ...current,
    ...updates,
    ble: {
      ...current.ble,
      ...(updates.ble || {}),
    },
    wifi: {
      ...current.wifi,
      ...(updates.wifi || {}),
    },
    classic: {
      ...current.classic,
      ...(updates.classic || {}),
    },
  };

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("amritjal:printer-settings-changed", {
        detail: next,
      })
    );
  }

  return next;
}

export function clearPrinterSettings() {
  if (isBrowser()) {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("amritjal:printer-settings-changed", {
        detail: getPrinterSettings(),
      })
    );
  }

  return getPrinterSettings();
}

export function subscribePrinterSettings(callback) {
  if (!isBrowser()) return () => {};

  const handler = (event) => {
    callback(event.detail || getPrinterSettings());
  };

  window.addEventListener(
    "amritjal:printer-settings-changed",
    handler
  );

  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(
      "amritjal:printer-settings-changed",
      handler
    );

    window.removeEventListener("storage", handler);
  };
}
