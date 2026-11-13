import { useState } from "react";
import { Filter, ChevronUp, ChevronDown } from "lucide-react";

export default function WalletFilters({ onSearch }) {
  const initial = {
    min: "",
    max: "",
    from: "",
    to: "",
    key: "",
    type: "",
  };

  const [filters, setFilters] = useState(initial);
  const [open, setOpen] = useState(false);

  const update = (name, value) => {
    setFilters((old) => ({ ...old, [name]: value }));
  };

  const reset = () => {
    setFilters(initial);
    onSearch(initial);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Wallet Transactions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Money in and out of this wallet.
          </p>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Filter size={18} />
          Filters
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Amount
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.min}
                  onChange={(e) => update("min", e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-cyan-500"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.max}
                  onChange={(e) => update("max", e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => update("from", e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-3 text-sm outline-none focus:border-cyan-500"
                />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => update("to", e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-slate-200 px-2 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Transaction Key
              </label>
              <input
                type="text"
                placeholder="Select options / Search key"
                value={filters.key}
                onChange={(e) => update("key", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <label className="mb-3 block text-sm font-medium text-slate-600">
              Transaction Type
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => update("type", filters.type === "in" ? "" : "in")}
                className={`rounded-full border px-5 py-2 text-sm ${
                  filters.type === "in"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Money In
              </button>

              <button
                onClick={() => update("type", filters.type === "out" ? "" : "out")}
                className={`rounded-full border px-5 py-2 text-sm ${
                  filters.type === "out"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                Money Out
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={reset}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              onClick={() => onSearch(filters)}
              className="rounded-lg bg-[#3975bb] px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
