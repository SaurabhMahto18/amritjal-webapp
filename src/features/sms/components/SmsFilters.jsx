import { RotateCcw, Search } from "lucide-react";

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS =
  "mb-1.5 block text-sm font-medium text-slate-600";

function SelectField({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <label className="block min-w-0">
      <span className={LABEL_CLASS}>{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
];

export default function SmsFilters({
  filters,
  groups = [],
  onChange,
  onSearch,
  onReset,
}) {
  const set = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      {/* TOP FILTER ROW */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

        {/* CUSTOMER SEARCH */}

        <label className="block min-w-0">
          <span className={LABEL_CLASS}>
            Customer / Mobile
          </span>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={filters.search}
              onChange={(e) =>
                set("search", e.target.value)
              }
              placeholder="Search customer or mobile..."
              className={`${SELECT_CLASS} pl-10`}
            />
          </div>
        </label>

        {/* CUSTOMER GROUP */}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Customer Group
          </label>

          <select
            value={filters.group_id || ""}
            onChange={(e) => onChange("group_id", e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Groups</option>

            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* CHANNEL */}

        <SelectField
          label="Channel"
          value={filters.channel}
          onChange={(value) => set("channel", value)}
          options={[
            { value: "all", label: "All" },
            { value: "message", label: "Message" },
            { value: "whatsapp", label: "WhatsApp" },
          ]}
        />
      </div>

      <div className="my-5 border-t border-slate-200" />

      {/* MESSAGE SETTINGS */}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Message Settings
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SelectField
            label="Send Delivery SMS"
            value={filters.delivery}
            onChange={(value) => set("delivery", value)}
            options={statusOptions}
          />

          <SelectField
            label="Send Payment Received SMS"
            value={filters.payment_received}
            onChange={(value) =>
              set("payment_received", value)
            }
            options={statusOptions}
          />

          <SelectField
            label="Send Invoice Ready SMS"
            value={filters.invoice_ready}
            onChange={(value) =>
              set("invoice_ready", value)
            }
            options={statusOptions}
          />

          <SelectField
            label="Payment Reminder"
            value={filters.payment_reminder}
            onChange={(value) =>
              set("payment_reminder", value)
            }
            options={statusOptions}
          />

        </div>
      </div>

      {/* ACTION BUTTONS */}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={15} />
          Reset
        </button>

        <button
          type="submit"
          className="rounded-lg bg-[#3976bd] px-7 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2864a8]"
        >
          Search
        </button>
      </div>
    </form>
  );
}