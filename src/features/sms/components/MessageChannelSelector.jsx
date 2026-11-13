import { MessageCircle, MessageSquare } from "lucide-react";

const channels = [
  {
    value: "message",
    label: "Message",
    icon: MessageSquare,
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
  },
];

export default function MessageChannelSelector({
  value = "message",
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-600">
        Message channel
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {channels.map(({ value: channel, label, icon: Icon }) => {
          const active = value === channel;

          return (
            <button
              key={channel}
              type="button"
              disabled={disabled}
              onClick={() => onChange(channel)}
              aria-pressed={active}
              className={`flex min-h-12 items-center gap-3 rounded-lg border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-blue-500 bg-blue-50 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full border ${
                  active
                    ? "border-blue-600"
                    : "border-slate-300"
                }`}
              >
                {active && (
                  <span className="size-2.5 rounded-full bg-blue-600" />
                )}
              </span>

              <Icon size={17} />

              <span className="text-sm font-semibold">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}