export const SMS_CHANNELS = {
  MESSAGE: "message",
  WHATSAPP: "whatsapp",
};

export const SMS_CHANNEL_OPTIONS = [
  {
    value: SMS_CHANNELS.MESSAGE,
    label: "Message",
  },
  {
    value: SMS_CHANNELS.WHATSAPP,
    label: "WhatsApp",
  },
];

export const NOTIFICATION_TYPES = {
  DELIVERY: "delivery",
  PAYMENT_RECEIVED: "payment_received",
  INVOICE_READY: "invoice_ready",
  PAYMENT_REMINDER: "payment_reminder",
};

export const NOTIFICATION_OPTIONS = [
  {
    key: NOTIFICATION_TYPES.DELIVERY,
    label: "Send Delivery SMS",
  },
  {
    key: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    label: "Send Payment Received SMS",
  },
  {
    key: NOTIFICATION_TYPES.INVOICE_READY,
    label: "Send Invoice Ready SMS",
  },
  {
    key: NOTIFICATION_TYPES.PAYMENT_REMINDER,
    label: "Payment Reminder",
  },
];

export const REPEAT_TYPES = {
  DAILY: "daily",
  WEEKDAYS: "weekdays",
  MONTHLY: "monthly",
};

export const REPEAT_OPTIONS = [
  {
    value: REPEAT_TYPES.DAILY,
    label: "Daily",
  },
  {
    value: REPEAT_TYPES.WEEKDAYS,
    label: "Weekdays",
  },
  {
    value: REPEAT_TYPES.MONTHLY,
    label: "Monthly",
  },
];

export const WEEKDAYS = [
  { value: 0, label: "SUN" },
  { value: 1, label: "MON" },
  { value: 2, label: "TUE" },
  { value: 3, label: "WED" },
  { value: 4, label: "THU" },
  { value: 5, label: "FRI" },
  { value: 6, label: "SAT" },
];

export const MONTH_DATES = Array.from(
  { length: 31 },
  (_, index) => index + 1
);

export const END_OF_MONTH = "end_of_month";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  delivery: false,
  payment_received: false,
  invoice_ready: false,
};

export const DEFAULT_PAYMENT_REMINDER = {
  enabled: false,
  channel: SMS_CHANNELS.MESSAGE,
  start_date: "",
  repeat_type: REPEAT_TYPES.DAILY,
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  month_dates: [1],
  end_of_month: false,
};

export const SMS_FILTER_DEFAULTS = {
  search: "",
  group_id: "",
  channel: "all",
  delivery: "all",
  payment_received: "all",
  invoice_ready: "all",
  payment_reminder: "all",
};

export const SMS_PAGE_SIZE = 10;