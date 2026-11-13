
import { Filter, Search, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GroupFilters({
  search,
  setSearch,
  filter,
  setFilter,
  showFilters,
  setShowFilters,
  onClear,
}) {
  const navigate = useNavigate();

  const active =
    filter !== "all" || search.trim() !== "";

  return (
    <section className="rounded-2xl border border-[#DCE8EA] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        {/* SEARCH */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8299A5]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search group..."
            aria-label="Search customer groups"
            className="w-full rounded-xl border border-[#DCE8EA] bg-white py-3 pl-11 pr-4 text-sm outline-none placeholder:text-[#8299A5] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
          />
        </div>

        {/* FILTER BUTTON */}
        <button
          type="button"
          onClick={() =>
            setShowFilters((previous) => !previous)
          }
          aria-expanded={showFilters}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition ${
            showFilters || active
              ? "border-[#087F8C] bg-[#DDF4F1] text-[#087F8C]"
              : "border-[#DCE8EA] bg-white text-[#102D3A] hover:bg-[#F3F7F8]"
          }`}
        >
          <Filter size={17} />
          Filters
        </button>

        {/* CREATE GROUP */}
        <button
          type="button"
          onClick={() => navigate("/groups/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066B76] focus:outline-none focus:ring-4 focus:ring-[#087F8C]/15"
        >
          <Plus size={18} />
          Create Group
        </button>

        {/* CLEAR FILTERS */}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-[#087F8C] transition hover:bg-[#DDF4F1]"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* FILTER OPTIONS */}
      {showFilters && (
        <div className="mt-4 border-t border-[#DCE8EA] pt-4">
          <label
            htmlFor="group-balance-filter"
            className="mb-2 block text-xs font-semibold text-[#8299A5]"
          >
            Group Balance
          </label>

          <select
            id="group-balance-filter"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="w-full rounded-xl border border-[#DCE8EA] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 sm:max-w-xs"
          >
            <option value="all">All Groups</option>
            <option value="due">Groups with Outstanding Due</option>
            <option value="advance">Groups with Advance</option>
            <option value="no-due">No Outstanding Due</option>
            <option value="empty">Groups without Customers</option>
          </select>
        </div>
      )}
    </section>
  );
}
