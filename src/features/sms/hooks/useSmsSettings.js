import { useCallback, useEffect, useState } from "react";
import { smsSettingsService } from "../services/smsSettingsService";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PAYMENT_REMINDER,
} from "../utils/smsConstants";
import {
  validatePaymentReminder,
  validateSmsSettings,
} from "../utils/smsValidators";

export function useSmsSettings(customerId) {
  const [settings, setSettings] = useState({
    channel: "message",
    ...DEFAULT_NOTIFICATION_SETTINGS,
  });

  const [reminder, setReminder] = useState({
    ...DEFAULT_PAYMENT_REMINDER,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!customerId) {
      setSettings({
        channel: "message",
        ...DEFAULT_NOTIFICATION_SETTINGS,
      });
      setReminder({ ...DEFAULT_PAYMENT_REMINDER });
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await smsSettingsService.getCustomerSettings(customerId);

      setSettings({
        channel: result?.channel || "message",
        delivery: result?.delivery ?? false,
        payment_received: result?.payment_received ?? false,
        invoice_ready: result?.invoice_ready ?? false,
      });

      setReminder({
        ...DEFAULT_PAYMENT_REMINDER,
        ...(result?.reminder || {}),
        weekdays: result?.reminder?.weekdays || [0, 1, 2, 3, 4, 5, 6],
        month_dates: result?.reminder?.month_dates || [1],
      });
    } catch (err) {
      console.error("SMS settings loading error:", err);
      setError(err.message || "SMS settings load nahi ho paayi.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback((updates) => {
    setSettings((current) => ({
      ...current,
      ...updates,
    }));
    setSuccess(false);
  }, []);

  const updateReminder = useCallback((updates) => {
    setReminder((current) => ({
      ...current,
      ...updates,
    }));
    setSuccess(false);
  }, []);

  const saveSettings = useCallback(async () => {
    if (!customerId) {
      setError("Pehle customer select karein.");
      return false;
    }

    const settingsError = validateSmsSettings(settings);
    if (settingsError) {
      setError(settingsError);
      return false;
    }

    const reminderError = validatePaymentReminder(reminder);
    if (reminder.enabled && reminderError) {
      setError(reminderError);
      return false;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await smsSettingsService.saveCustomerSettings({
        customerId,
        settings,
        reminder,
      });

      setSuccess(true);
      return true;
    } catch (err) {
      console.error("SMS settings save error:", err);
      setError(err.message || "Settings save nahi ho paayi.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [customerId, settings, reminder]);

  return {
    settings,
    reminder,
    loading,
    saving,
    error,
    success,
    updateSettings,
    updateReminder,
    saveSettings,
    refresh: loadSettings,
  };
}