import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Users,
  Package,
  Wallet,
  Plus,
  Trash2,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Pencil,
  X,
  Phone,
  UsersRound,
  UserRound,
  HandCoins,
} from "lucide-react";

import groupService from "../services/groupService";
import useGroups from "../hooks/useGroups";
import GroupForm from "../components/GroupForm";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const compactCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

function CustomerMobileCard({ customer, saving, onRemove }) {
  const [deleteRevealed, setDeleteRevealed] = useState(false);
  const pointerStart = useRef(null);
  const swipedRef = useRef(false);

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse") return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
    swipedRef.current = false;
  };

  const handlePointerUp = (event) => {
    if (!pointerStart.current) return;

    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;

    // Horizontal swipe only; native vertical page scrolling remains available.
    if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      setDeleteRevealed(deltaX < 0);
      swipedRef.current = true;
    }
  };

  const phoneNumber = String(customer.phone || "").trim();
  const phoneHref = phoneNumber
    ? `tel:${phoneNumber.replace(/[^\d+]/g, "")}`
    : undefined;

  // Prefer the customer's net due; when there is no due, show advance as a
  // positive amount even if the source stores it as a negative balance.
  const rawDue = Number(
    customer.due ?? customer.totalDue ?? customer.total_due ?? 0
  );
  const rawAdvance = Number(
    customer.advance ?? customer.advanceAmount ?? customer.advance_amount ?? 0
  );
  const totalDue = Math.max(0, rawDue);
  const advanceAmount = totalDue > 0
    ? 0
    : Math.max(Math.abs(rawAdvance), Math.max(0, -rawDue));
  const hasDue = totalDue > 0;
  const accountAmount = hasDue ? totalDue : advanceAmount;
  const pastDue = Number(customer.pastDue ?? customer.past_due ?? 0);
  const currentDue = Number(customer.currentDue ?? customer.current_due ?? 0);
  const jarBalance = Number(customer.jarBalance ?? customer.jar_balance ?? 0);

  return (
    <article
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onClickCapture={(event) => {
        if (event.target.closest?.("[data-swipe-delete]")) return;
        if (swipedRef.current) {
          swipedRef.current = false;
          event.preventDefault();
          event.stopPropagation();
        } else if (deleteRevealed) {
          // First tap on an opened swipe card closes the action instead of navigating.
          setDeleteRevealed(false);
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      className="relative overflow-hidden rounded-xl border border-[#E3EBED] bg-rose-500 shadow-sm touch-pan-y"
    >
      <div className="absolute inset-y-0 right-0 flex w-[82px] items-center justify-center bg-rose-600">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!saving) onRemove();
          }}
          disabled={saving}
          aria-label={`Delete ${customer.name} from group`}
          data-swipe-delete
          title="Remove customer from group"
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Trash2 size={18} />
          )}
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      <div
        className={`relative z-10 bg-white px-2.5 py-2.5 transition-transform duration-200 ease-out ${
          deleteRevealed ? "-translate-x-[82px]" : "translate-x-0"
        }`}
      >
        <Link
          to={`/customers/${customer.id}`}
          aria-label={`Open ${customer.name || "customer"} profile`}
          className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
        />

        <div className="pointer-events-none relative z-10 flex items-center gap-2.5">
          <div className="flex size-[48px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#00A6C8] text-white">
            <UserRound size={31} strokeWidth={1.7} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-semibold leading-5 text-[#252A30]">
              {customer.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-[#92999F]">
              {customer.phone || "Phone not added"}
            </p>
            <p className="truncate text-[11px] leading-4 text-[#A2A7AC]">
              {customer.area || customer.address || "Customer"}
            </p>
          </div>

          <div className="pointer-events-auto relative z-20 flex shrink-0 items-center gap-2.5 pr-0.5">
            {phoneHref ? (
              <a
                href={phoneHref}
                aria-label={`Call ${customer.name}`}
                onClick={(event) => event.stopPropagation()}
                className="flex size-7 items-center justify-center text-[#159FD1]"
              >
                <Phone size={17} fill="currentColor" strokeWidth={1.8} />
              </a>
            ) : null}
            <Link
              to={`/customers/${customer.id}`}
              aria-label={`Open account for ${customer.name}`}
              onClick={(event) => event.stopPropagation()}
              className="flex size-7 items-center justify-center text-[#159FD1]"
            >
              <HandCoins size={20} strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <div className="pointer-events-none relative z-10 my-2 border-t border-[#C9CDD0]" />

        <div className="pointer-events-none relative z-10 grid grid-cols-4 divide-x divide-[#D9DDE0] text-center">
          <div className="min-w-0 px-0.5">
            <p className="truncate text-[12px] font-bold leading-4 text-[#168CCB]">
              {jarBalance}
            </p>
            <p className="mt-0.5 truncate text-[9px] leading-3.5 text-[#9A9FA4]">
              Balance Jar
            </p>
          </div>
          <div className="min-w-0 px-0.5">
            <p className="truncate text-[12px] font-bold leading-4 text-[#252A30]">
              {compactCurrency(pastDue)}
            </p>
            <p className="mt-0.5 truncate text-[9px] leading-3.5 text-[#9A9FA4]">
              Past Due
            </p>
          </div>
          <div className="min-w-0 px-0.5">
            <p className="truncate text-[12px] font-bold leading-4 text-[#252A30]">
              {compactCurrency(currentDue)}
            </p>
            <p className="mt-0.5 truncate text-[9px] leading-3.5 text-[#9A9FA4]">
              Current Due
            </p>
          </div>
          <div className="min-w-0 px-0.5">
            <p className={`truncate text-[12px] font-bold leading-4 ${hasDue ? "text-[#D65E6B]" : "text-[#38B68A]"}`}>
              {compactCurrency(accountAmount)}
            </p>
            <p className="mt-0.5 truncate text-[9px] leading-3.5 text-[#9A9FA4]">
              {hasDue ? "Total Due" : "Adv Amt"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const { updateGroup } = useGroups();

  const [group, setGroup] = useState(null);
  const loadedGroupIdRef = useRef(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LOAD GROUP DETAILS
  const loadGroup = useCallback(async () => {
    const isFirstLoadForGroup = loadedGroupIdRef.current !== id;
    if (isFirstLoadForGroup) setLoading(true);
    setError("");

    try {
      const [groupData, customerOptions] = await Promise.all([
        groupService.getById(id),
        groupService.getAvailableCustomers(id),
      ]);

      setGroup(groupData);
      loadedGroupIdRef.current = id;
      setAvailableCustomers(customerOptions || []);
    } catch (err) {
      console.error("Group detail loading failed:", err);
      setError(err?.message || "Unable to load group details.");
      if (isFirstLoadForGroup) {
        setGroup(null);
        setAvailableCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  // SEO METADATA
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const previousDescription = descriptionMeta?.getAttribute("content");
    const previousRobots = robotsMeta?.getAttribute("content");
    const description = descriptionMeta || document.createElement("meta");
    const robots = robotsMeta || document.createElement("meta");

    const groupName = group?.name || "Customer Group";
    document.title = `${groupName} | Group Details | Amrit Jal`;

    description.setAttribute("name", "description");
    description.setAttribute(
      "content",
      group
        ? `Manage ${groupName} customer group, assigned customers, delivery areas, jar balances and outstanding accounts in Amrit Jal.`
        : "Manage customer groups, assigned customers and delivery area records in Amrit Jal."
    );
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, nofollow");

    if (!descriptionMeta) document.head.appendChild(description);
    if (!robotsMeta) document.head.appendChild(robots);

    return () => {
      document.title = previousTitle;
      if (descriptionMeta) {
        if (previousDescription === null) description.removeAttribute("content");
        else description.setAttribute("content", previousDescription);
      } else {
        description.remove();
      }
      if (robotsMeta) {
        if (previousRobots === null) robots.removeAttribute("content");
        else robots.setAttribute("content", previousRobots);
      } else {
        robots.remove();
      }
    };
  }, [group]);

  // ADD CUSTOMER TO GROUP
  async function handleAddCustomer(event) {
    event.preventDefault();

    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await groupService.addCustomer(id, selectedCustomer);
      setSelectedCustomer("");
      setSuccess("Customer added to group successfully.");
      await loadGroup();
    } catch (err) {
      setError(err?.message || "Unable to add customer.");
    } finally {
      setSaving(false);
    }
  }

  // REMOVE CUSTOMER FROM GROUP
  async function handleRemoveCustomer(customer) {
    const confirmed = window.confirm(`Remove ${customer.name} from ${group.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await groupService.removeCustomer(id, customer.id);
      setSuccess("Customer removed from group.");
      await loadGroup();
    } catch (err) {
      setError(err?.message || "Unable to remove customer.");
    } finally {
      setSaving(false);
    }
  }

  // EDIT GROUP — compact icon button beside the group title
  async function handleUpdateGroup(values) {
    setEditSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateGroup(group.id, values);
      if (result) {
        setShowEditForm(false);
        await loadGroup();
        setSuccess("Group details updated successfully.");
      } else {
        setError("Unable to update group. Please check the details and try again.");
      }
      return result;
    } catch (err) {
      setError(err?.message || "Unable to update group.");
      return false;
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 bg-[#F3F7F8] px-4 text-sm text-[#8299A5]">
        <LoaderCircle className="animate-spin text-[#087F8C]" size={20} />
        Loading group details...
      </div>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-[#F3F7F8] p-3 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            Group not available
          </div>
          <p className="mt-2 text-sm text-red-700">{error || "Group not found."}</p>
          <button
            type="button"
            onClick={() => void loadGroup()}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#087F8C] px-3 text-xs font-semibold text-white"
          >
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </main>
    );
  }

  const groupCustomers = Array.isArray(group.customers) ? group.customers : [];
  const summaryItems = [
    {
      title: "Customers",
      value: group.customerCount ?? groupCustomers.length,
      icon: Users,
      tone: "text-[#087F8C] bg-[#DDF4F1]",
    },
    {
      title: "Balance Jar",
      value: group.balanceJar ?? 0,
      icon: Package,
      tone: "text-[#347DBE] bg-[#E8F2FC]",
    },
    {
      title: "Total Due",
      value: currency(group.totalDue),
      icon: Wallet,
      tone: "text-[#C65D70] bg-[#FCECEF]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F3F7F8] px-3 pb-6 pt-3 text-[#102D3A] sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1300px] space-y-3.5 sm:space-y-5">
        {/* GROUP HEADER — no back button; edit stays compact beside the title */}
        <section className="flex items-center gap-3 rounded-2xl border border-[#DCE8EA] bg-white p-3 shadow-sm sm:p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C] sm:size-12">
            <UsersRound size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-5 text-[#102D3A] sm:text-lg">
              {group.name}
            </h1>
            <p className="mt-1 text-[11px] text-[#8299A5] sm:text-xs">
              {groupCustomers.length} assigned {groupCustomers.length === 1 ? "customer" : "customers"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowEditForm(true);
            }}
            aria-label="Edit group"
            title="Edit group"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#DCE8EA] text-[#087F8C] transition hover:bg-[#EAF7F5] active:scale-95 sm:size-10"
          >
            <Pencil size={16} />
          </button>
        </section>

        {/* COMPACT SUMMARY CARDS */}
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="min-w-0 rounded-xl border border-[#DCE8EA] bg-white p-2.5 shadow-sm sm:rounded-2xl sm:p-5"
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] leading-4 text-[#8299A5] sm:text-sm">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold leading-5 text-[#102D3A] sm:mt-2 sm:text-xl">
                      {item.value}
                    </p>
                  </div>
                  <div className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${item.tone}`}>
                    <Icon size={19} />
                  </div>
                </div>
                <div className={`mt-1 flex size-6 items-center justify-center rounded-md sm:hidden ${item.tone}`}>
                  <Icon size={13} />
                </div>
              </div>
            );
          })}
        </section>

        {/* ALERTS */}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 sm:p-4 sm:text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700 sm:p-4 sm:text-sm">
            {success}
          </div>
        )}

        {/* ADD CUSTOMER */}
        <section className="rounded-2xl border border-[#DCE8EA] bg-white p-3.5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#DDF4F1] text-[#087F8C]">
              <Plus size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#102D3A] sm:text-base">Add Customer</h2>
              <p className="mt-0.5 text-[10px] leading-4 text-[#8299A5] sm:text-xs">
                Only unassigned customers are listed here.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddCustomer} className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <select
              value={selectedCustomer}
              onChange={(event) => setSelectedCustomer(event.target.value)}
              disabled={saving}
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#DCE8EA] bg-white px-3 text-sm outline-none transition focus:border-[#087F8C] focus:ring-2 focus:ring-[#087F8C]/10 disabled:bg-slate-50 sm:px-4"
            >
              <option value="">Select customer</option>
              {availableCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}{customer.area ? ` — ${customer.area}` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving || !selectedCustomer}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-4 text-xs font-semibold text-white transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-5 sm:text-sm"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              Add Customer
            </button>
          </form>
          {availableCustomers.length === 0 && (
            <p className="mt-2 text-[10px] text-[#8299A5] sm:text-xs">No unassigned customers available.</p>
          )}
        </section>

        {/* GROUP CUSTOMERS */}
        <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCE8EA] px-3.5 py-3 sm:px-5 sm:py-4">
            <div>
              <h2 className="text-sm font-bold text-[#102D3A] sm:text-base">Group Customers</h2>
              <p className="mt-0.5 text-[10px] text-[#8299A5] sm:text-xs">
                {groupCustomers.length} assigned {groupCustomers.length === 1 ? "customer" : "customers"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadGroup()}
              disabled={loading}
              aria-label="Refresh group"
              title="Refresh"
              className="flex size-8 items-center justify-center rounded-lg border border-[#DCE8EA] text-[#607987] hover:bg-slate-50 disabled:opacity-50 sm:size-9"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {groupCustomers.length === 0 ? (
            <div className="px-4 py-10 text-center sm:py-14">
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
                <Users size={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-[#102D3A]">No customers assigned</p>
              <p className="mt-1 text-xs text-[#8299A5]">Select a customer above to add them to this group.</p>
            </div>
          ) : (
            <>
              {/* Mobile customer cards — Call visible; swipe left to reveal Delete */}
              <div className="space-y-2.5 bg-[#F5F8F9] p-2.5 sm:hidden">
                {groupCustomers.map((customer) => (
                  <CustomerMobileCard
                    key={customer.id}
                    customer={customer}
                    saving={saving}
                    onRemove={() => void handleRemoveCustomer(customer)}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-[#EDF2F6] text-[#607987]">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Customer</th>
                      <th className="px-4 py-4 font-semibold">Phone</th>
                      <th className="px-4 py-4 text-right font-semibold">Balance Jar</th>
                      <th className="px-4 py-4 text-right font-semibold">Due</th>
                      <th className="px-4 py-4 text-right font-semibold">Advance</th>
                      <th className="px-5 py-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE8EA]">
                    {groupCustomers.map((customer) => (
                      <tr key={customer.id} className="transition hover:bg-[#F8FAFB]">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#102D3A]">{customer.name}</p>
                          <p className="mt-1 text-xs text-[#8299A5]">{customer.area || "Area not specified"}</p>
                        </td>
                        <td className="px-4 py-4 text-[#607987]">{customer.phone || "—"}</td>
                        <td className="px-4 py-4 text-right font-semibold">{customer.jarBalance ?? 0}</td>
                        <td className="px-4 py-4 text-right text-red-600">{currency(customer.due)}</td>
                        <td className="px-4 py-4 text-right text-[#087F8C]">{currency(customer.advance)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => void handleRemoveCustomer(customer)}
                            disabled={saving}
                            title="Remove customer from group"
                            aria-label={`Remove ${customer.name} from group`}
                            className="rounded-lg p-2 text-[#8299A5] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {/* EDIT GROUP MODAL — compact pencil trigger keeps header uncluttered */}
      {showEditForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-3 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !editSaving) setShowEditForm(false);
          }}
        >
          <section className="my-3 w-full max-w-xl overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-2xl sm:my-6">
            <div className="flex items-center justify-between border-b border-[#E8EFF0] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm font-bold text-[#102D3A] sm:text-base">Edit Group</h2>
                <p className="mt-0.5 text-[10px] text-[#8299A5] sm:text-xs">Update group information</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                disabled={editSaving}
                aria-label="Close edit form"
                className="flex size-8 items-center justify-center rounded-lg border border-[#DCE8EA] text-[#607987] hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-3.5 sm:p-5">
              <GroupForm
                initialData={group}
                onSubmit={handleUpdateGroup}
                onCancel={() => setShowEditForm(false)}
                saving={editSaving}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
