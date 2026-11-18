import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  UsersRound,
  Search,
  X,
  SlidersHorizontal,
} from "lucide-react";

import useGroups from "../hooks/useGroups";
import GroupForm from "../components/GroupForm";
import GroupSummaryCards from "../components/GroupSummaryCards";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const FILTERS = [
  { id: "all", label: "All groups" },
  { id: "due", label: "With due" },
  { id: "advance", label: "Advance" },
  { id: "no-due", label: "No due" },
  { id: "empty", label: "Empty" },
];

const getCreatorName = (group) => {
  const creator =
    group.createdByName ??
    group.created_by_name ??
    group.creatorName ??
    group.creator_name ??
    group.createdBy?.fullName ??
    group.createdBy?.name ??
    group.created_by?.full_name ??
    group.created_by?.name;

  return typeof creator === "string" && creator.trim() ? creator.trim() : "—";
};

const formatMetric = (value) => (Number(value) || 0).toFixed(1);

export default function GroupsPage() {
  const navigate = useNavigate();

  const {
    groups = [],
    summary,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useGroups();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [swipedGroupId, setSwipedGroupId] = useState(null);
  const touchStartRef = useRef(null);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return groups.filter((group) => {
      const name = String(group.name || "").toLowerCase();
      const matchesSearch = !term || name.includes(term);

      let matchesFilter = true;
      if (filter === "due") {
        matchesFilter = Number(group.totalDue || 0) > 0;
      } else if (filter === "advance") {
        matchesFilter = Number(group.advance || 0) < 0;
      } else if (filter === "no-due") {
        matchesFilter = Number(group.totalDue || 0) === 0;
      } else if (filter === "empty") {
        matchesFilter = Number(group.customerCount || 0) === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [groups, search, filter]);

  const hasActiveFilters = Boolean(search.trim()) || filter !== "all";

  function openCreate() {
    setEditingGroup(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(group) {
    setEditingGroup(group);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(values) {
    const result = editingGroup
      ? await updateGroup(editingGroup.id, values)
      : await createGroup(values);

    if (result) {
      setShowForm(false);
      setEditingGroup(null);
    }

    return result;
  }

  async function handleDelete(group) {
    const confirmed = window.confirm(
      `Delete group "${group.name}"?\n\nCustomers will be unassigned from this group. Their delivery and payment records will remain unchanged.`
    );

    if (!confirmed) return;
    await deleteGroup(group.id);
  }

  function closeForm() {
    setShowForm(false);
    setEditingGroup(null);
  }

  function clearFilters() {
    setSearch("");
    setFilter("all");
  }

  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const previousDescription = descriptionMeta?.content;
    const previousRobots = robotsMeta?.content;

    const description = descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    document.title = "Customer Groups | Amrit Jal";
    description.name = "description";
    description.content =
      "Manage customer groups, delivery areas, customer assignments, jar balances, outstanding dues and advances in Amrit Jal.";
    robots.name = "robots";
    robots.content = "noindex, nofollow";

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      if (descriptionMeta) description.content = previousDescription || "";
      else description.remove();
      if (robotsMeta) robots.content = previousRobots || "";
      else robots.remove();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-3 pb-8 pt-3 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-4 sm:space-y-5">
       

      

        {/* Create / edit form */}
        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3 sm:px-5 sm:py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  {editingGroup ? "Edit Group" : "Create a Group"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
                  {editingGroup ? "Update group information." : "Add a new customer group."}
                </p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close form" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <X size={17} />
              </button>
            </div>
            <div className="p-3.5 sm:p-5">
              <GroupForm
                initialData={editingGroup}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                saving={saving}
              />
            </div>
          </section>
        )}

        {/* Search and quick filter chips */}
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search groups..."
                aria-label="Search groups"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/70">
                  <X size={15} />
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50">
                Clear
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <SlidersHorizontal size={14} className="shrink-0 text-slate-400" />
            <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((item) => {
                const selected = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    aria-pressed={selected}
                    className={`min-h-8 shrink-0 rounded-full border px-3 text-[10px] font-semibold transition sm:text-xs ${
                      selected
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Groups list */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
         

          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center sm:py-16">
              <LoaderCircle size={26} className="animate-spin text-teal-700" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Loading groups...</p>
              <p className="mt-1 text-xs text-slate-400">Getting your customer groups.</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="px-5 py-12 text-center sm:py-16">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <UsersRound size={24} />
              </span>
              <h3 className="mt-3 text-sm font-bold text-slate-900 sm:text-base">No groups found</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 sm:text-sm">
                {hasActiveFilters ? "Try another search or clear the filters." : "Create your first group to organise customers."}
              </p>
              {hasActiveFilters ? (
                <button type="button" onClick={clearFilters} className="mt-4 inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-bold text-teal-700 hover:bg-teal-50">
                  Clear filters
                </button>
              ) : (
                <button type="button" onClick={openCreate} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white hover:bg-teal-800">
                  <Plus size={15} /> Create Group
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Screenshot-inspired compact mobile group cards */}
              <div className="space-y-2 bg-[#F3F3F3] p-2 sm:hidden">
                {filteredGroups.map((group) => (
                  <div key={group.id} className="relative overflow-hidden bg-white">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setSwipedGroupId(null);
                        handleDelete(group);
                      }}
                      aria-label={`Delete ${group.name}`}
                      className="absolute inset-y-0 right-0 flex w-[76px] flex-col items-center justify-center gap-1 bg-rose-600 text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                    >
                      <Trash2 size={19} />
                      <span className="text-xs font-semibold">Delete</span>
                    </button>

                    <article
                      className={`relative bg-white px-2.5 pb-2 pt-2.5 transition-transform duration-200 ease-out ${
                        swipedGroupId === group.id ? "-translate-x-[76px]" : "translate-x-0"
                      }`}
                      style={{ touchAction: "pan-y" }}
                      onTouchStart={(event) => {
                        const touch = event.touches[0];
                        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                      }}
                      onTouchEnd={(event) => {
                        if (!touchStartRef.current) return;
                        const touch = event.changedTouches[0];
                        const deltaX = touch.clientX - touchStartRef.current.x;
                        const deltaY = touch.clientY - touchStartRef.current.y;

                        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                          setSwipedGroupId(deltaX < 0 ? group.id : null);
                        }
                        touchStartRef.current = null;
                      }}
                    >
                    <div className="flex min-h-[70px] items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/groups/${group.id}`)}
                        aria-label={`View ${group.name}`}
                        className="flex w-[66px] shrink-0 items-center justify-center"
                      >
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#E8F3FB] text-[#347DBE]">
                          <UsersRound size={25} strokeWidth={2.1} />
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-[16px] font-semibold leading-5 text-[#252525]">
                          {group.name}
                        </span>
                        
                      </button>

                      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center self-stretch border-l border-[#BDBDBD] pl-1.5">
                        <span className="text-[16px] font-bold leading-5 text-black">
                          {Number(group.customerCount) || 0}
                        </span>
                        <span className="mt-0.5 text-center text-[11px] leading-4 text-[#A0A0A0]">
                          Customers
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 border-t border-[#BDBDBD]" />

                    <div className="grid grid-cols-4 pt-2">
                      <div className="min-w-0 border-r border-[#BDBDBD] px-1 text-center">
                        <p className="truncate text-[14px] font-bold leading-5 text-[#3196D2]">
                          {Number(group.balanceJar) || 0}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-3.5 text-[#A0A0A0]">
                          Balance Jar
                        </p>
                      </div>
                      <div className="min-w-0 border-r border-[#BDBDBD] px-1 text-center">
                        <p className="truncate text-[14px] font-bold leading-5 text-[#C65D70]">
                          {formatMetric(group.pastDue ?? group.past_due)}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-3.5 text-[#A0A0A0]">
                          Past Due
                        </p>
                      </div>
                      <div className="min-w-0 border-r border-[#BDBDBD] px-1 text-center">
                        <p className="truncate text-[14px] font-bold leading-5 text-[#C65D70]">
                          {formatMetric(group.currentDue ?? group.current_due)}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-3.5 text-[#A0A0A0]">
                          Current Due
                        </p>
                      </div>
                      <div className="min-w-0 px-1 text-center">
                        <p className="truncate text-[14px] font-bold leading-5 text-[#3FA887]">
                          {formatMetric(group.advance)}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-3.5 text-[#A0A0A0]">
                          Advance
                        </p>
                      </div>
                    </div>

                    </article>
                  </div>
                ))}
              </div>

              {/* Desktop data table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Group</th>
                      <th className="px-4 py-4 text-center font-semibold">Balance Jar</th>
                      <th className="px-4 py-4 text-center font-semibold">Customers</th>
                      <th className="px-4 py-4 text-right font-semibold">Past Due</th>
                      <th className="px-4 py-4 text-right font-semibold">Current Due</th>
                      <th className="px-4 py-4 text-right font-semibold">Total Due</th>
                      <th className="px-4 py-4 text-right font-semibold">Advance</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroups.map((group) => (
                      <tr key={group.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <button type="button" onClick={() => navigate(`/groups/${group.id}`)} className="flex items-center gap-3 text-left">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Users size={19} />
                            </span>
                            <span className="font-semibold text-slate-800 hover:text-teal-700">{group.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-800">{group.balanceJar}</td>
                        <td className="px-4 py-4 text-center">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">{group.customerCount}</span>
                        </td>
                        <td className="px-4 py-4 text-right text-slate-400">—</td>
                        <td className="px-4 py-4 text-right text-slate-400">—</td>
                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 font-medium text-rose-700">{formatCurrency(group.totalDue)}</span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-teal-700">{formatCurrency(group.advance)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button type="button" title="View group" aria-label={`View ${group.name}`} onClick={() => navigate(`/groups/${group.id}`)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                              <Eye size={16} />
                            </button>
                            <button type="button" title="Edit group" aria-label={`Edit ${group.name}`} onClick={() => openEdit(group)} className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700">
                              <Pencil size={16} />
                            </button>
                            <button type="button" title="Delete group" aria-label={`Delete ${group.name}`} disabled={saving} onClick={() => handleDelete(group)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="border-t border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-[10px] leading-4 text-slate-500 sm:px-5 sm:py-3 sm:text-xs">
            Total outstanding is calculated from opening balance, deliveries and payments. Past Due / Current Due require billing-period configuration.
          </div>
        </section>
      </div>
    </main>
  );
}
