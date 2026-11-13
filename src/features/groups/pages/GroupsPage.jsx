
import { useMemo, useState, useEffect } from "react";
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
} from "lucide-react";

import useGroups from "../hooks/useGroups";
import GroupForm from "../components/GroupForm";
import GroupFilters from "../components/GroupFilters";
import GroupSummaryCards from "../components/GroupSummaryCards";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function GroupsPage() {
  const navigate = useNavigate();

  const {
    groups,
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
  const [showFilters, setShowFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(term);

      let matchesFilter = true;

      if (filter === "due") {
        matchesFilter = group.totalDue > 0;
      } else if (filter === "advance") {
        matchesFilter = group.advance < 0;
      } else if (filter === "no-due") {
        matchesFilter = group.totalDue === 0;
      } else if (filter === "empty") {
        matchesFilter = group.customerCount === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [groups, search, filter]);

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

  function clearFilters() {
    setSearch("");
    setFilter("all");
  }



  // SEO METADATA
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );
    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription = descriptionMeta?.content;
    const previousRobots = robotsMeta?.content;

    const description =
      descriptionMeta || document.createElement("meta");
    const robots =
      robotsMeta || document.createElement("meta");

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

      if (descriptionMeta) {
        description.content = previousDescription || "";
      } else {
        description.remove();
      }

      if (robotsMeta) {
        robots.content = previousRobots || "";
      } else {
        robots.remove();
      }
    };
  }, []);


  return (
    <main className="min-h-screen bg-[#F3F7F8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">

       
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Summary */}
        <GroupSummaryCards summary={summary} />

        {/* Create / Edit */}
        {showForm && (
          <section className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm sm:p-6">
            <GroupForm
              initialData={editingGroup}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingGroup(null);
              }}
              saving={saving}
            />
            
          </section>
        )}

        {/* Filters */}
        <GroupFilters
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          onClear={clearFilters}
          
        />
        
        

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#DCE8EA] px-5 py-4">
            <div>
              <h2 className="font-bold text-[#102D3A]">
                Group Overview
              </h2>
              <p className="mt-1 text-xs text-[#8299A5]">
                {filteredGroups.length} of {groups.length} groups
              </p>
            </div>

            <button
              type="button"
              onClick={loadGroups}
              disabled={loading}
              className="rounded-lg border border-[#DCE8EA] p-2 text-[#607987] hover:bg-[#F3F7F8]"
              title="Refresh groups"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#8299A5]">
              <LoaderCircle className="animate-spin text-[#087F8C]" />
              Loading groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <UsersRound
                size={35}
                className="mx-auto mb-3 text-[#087F8C]"
              />
              <h3 className="font-semibold text-[#102D3A]">
                No groups found
              </h3>
              <p className="mt-1 text-sm text-[#8299A5]">
                Create a group or change your search filters.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 rounded-xl bg-[#087F8C] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Create Group
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-[#EDF2F6] text-[#607987]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Group</th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Balance Jar
                    </th>
                    <th className="px-4 py-4 text-center font-semibold">
                      Customers
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Past Due
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Current Due
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Total Due
                    </th>
                    <th className="px-4 py-4 text-right font-semibold">
                      Advance
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCE8EA]">
                  {filteredGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="transition hover:bg-[#F8FAFB]"
                    >
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/groups/${group.id}`)
                          }
                          className="flex items-center gap-3 text-left"
                        >
                          <span className="flex size-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
                            <Users size={21} />
                          </span>

                          <span className="font-semibold text-[#102D3A] hover:text-[#087F8C]">
                            {group.name}
                          </span>
                        </button>
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-[#102D3A]">
                        {group.balanceJar}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="rounded-lg bg-[#EDF2F6] px-2.5 py-1.5 font-medium text-[#607987]">
                          {group.customerCount}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-[#8299A5]">
                        —
                      </td>

                      <td className="px-4 py-4 text-right text-[#8299A5]">
                        —
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-600">
                          {formatCurrency(group.totalDue)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-[#087F8C]">
                        {formatCurrency(group.advance)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          

                          <button
                            type="button"
                            title="Edit group"
                            onClick={() => openEdit(group)}
                            className="rounded-lg p-2 text-[#607987] hover:bg-[#DDF4F1] hover:text-[#087F8C]"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete group"
                            disabled={saving}
                            onClick={() => handleDelete(group)}
                            className="rounded-lg p-2 text-[#8299A5] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#DCE8EA] bg-[#F8FAFB] px-5 py-3 text-xs text-[#8299A5]">
            Total outstanding is calculated from opening balance, deliveries and payments.
            Past Due / Current Due require billing-period configuration.
          </div>
        </section>
      </div>
    </main>
  );
}
