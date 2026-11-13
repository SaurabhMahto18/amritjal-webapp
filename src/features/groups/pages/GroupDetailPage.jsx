
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Package,
  Wallet,
  Plus,
  Trash2,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import groupService from "../services/groupService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [availableCustomers, setAvailableCustomers] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // LOAD GROUP DETAILS
  const loadGroup = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [groupData, customerOptions] = await Promise.all([
        groupService.getById(id),
        groupService.getAvailableCustomers(id),
      ]);

      setGroup(groupData);
      setAvailableCustomers(customerOptions || []);
    } catch (err) {
      console.error("Group detail loading failed:", err);

      setError(
        err?.message || "Unable to load group details."
      );

      setGroup(null);
      setAvailableCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // INITIAL GROUP LOADING
  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  // SEO METADATA
  // Keep this hook above all conditional returns.
  useEffect(() => {
    const previousTitle = document.title;

    const descriptionMeta = document.querySelector(
      'meta[name="description"]'
    );

    const robotsMeta = document.querySelector(
      'meta[name="robots"]'
    );

    const previousDescription =
      descriptionMeta?.getAttribute("content");

    const previousRobots =
      robotsMeta?.getAttribute("content");

    const description =
      descriptionMeta || document.createElement("meta");

    const robots =
      robotsMeta || document.createElement("meta");

    const groupName = group?.name || "Customer Group";

    const pageTitle =
      `${groupName} | Group Details | Amrit Jal`;

    const pageDescription = group
      ? `Manage ${groupName} customer group, assigned customers, delivery areas, jar balances and outstanding accounts in Amrit Jal.`
      : "Manage customer groups, assigned customers and delivery area records in Amrit Jal.";

    document.title = pageTitle;

    description.setAttribute("name", "description");
    description.setAttribute("content", pageDescription);

    robots.setAttribute("name", "robots");
    robots.setAttribute("content", "noindex, nofollow");

    if (!descriptionMeta) {
      document.head.appendChild(description);
    }

    if (!robotsMeta) {
      document.head.appendChild(robots);
    }

    return () => {
      document.title = previousTitle;

      if (descriptionMeta) {
        if (previousDescription === null) {
          description.removeAttribute("content");
        } else {
          description.setAttribute(
            "content",
            previousDescription
          );
        }
      } else {
        description.remove();
      }

      if (robotsMeta) {
        if (previousRobots === null) {
          robots.removeAttribute("content");
        } else {
          robots.setAttribute("content", previousRobots);
        }
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
      setError(
        err?.message || "Unable to add customer."
      );
    } finally {
      setSaving(false);
    }
  }

  // REMOVE CUSTOMER FROM GROUP
  async function handleRemoveCustomer(customer) {
    const confirmed = window.confirm(
      `Remove ${customer.name} from ${group.name}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await groupService.removeCustomer(id, customer.id);

      setSuccess("Customer removed from group.");

      await loadGroup();
    } catch (err) {
      setError(
        err?.message || "Unable to remove customer."
      );
    } finally {
      setSaving(false);
    }
  }

  // CONDITIONAL RETURNS
  // All React hooks are declared before this section.

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 bg-[#F3F7F8] text-sm text-[#8299A5]">
        <LoaderCircle className="animate-spin text-[#087F8C]" />
        Loading group details...
      </div>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen bg-[#F3F7F8] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            Group not available
          </div>

          <p className="mt-2 text-sm text-red-700">
            {error || "Group not found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/groups")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#087F8C]"
          >
            <ArrowLeft size={16} />
            Back to Groups
          </button>
        </div>
      </main>
    );
  }

  const groupCustomers = Array.isArray(group.customers)
    ? group.customers
    : [];

  // MAIN PAGE
  return (
    <main className="min-h-screen bg-[#F3F7F8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1300px] space-y-5">

        {/* BACK NAVIGATION */}

        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#087F8C] transition hover:text-[#066B76]"
        >
          <ArrowLeft size={17} />
          Back to Groups
        </button>

        
        {/* SUMMARY CARDS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              title: "Customers",
              value: group.customerCount ?? groupCustomers.length,
              icon: Users,
            },
            {
              title: "Balance Jar",
              value: group.balanceJar ?? 0,
              icon: Package,
            },
            {
              title: "Total Due",
              value: currency(group.totalDue),
              icon: Wallet,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#8299A5]">
                      {item.title}
                    </p>

                    <p className="mt-2 text-xl font-bold text-[#102D3A]">
                      {item.value}
                    </p>
                  </div>

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ERROR AND SUCCESS ALERTS */}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* ADD CUSTOMER */}

        <section className="rounded-2xl border border-[#DCE8EA] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-[#102D3A]">
            Add Customer to Group
          </h2>

          <p className="mt-1 text-sm text-[#8299A5]">
            Only customers who are not assigned to another group are shown.
          </p>

          <form
            onSubmit={handleAddCustomer}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <select
              value={selectedCustomer}
              onChange={(event) =>
                setSelectedCustomer(event.target.value)
              }
              disabled={saving}
              className="min-w-0 flex-1 rounded-xl border border-[#DCE8EA] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10 disabled:bg-slate-50"
            >
              <option value="">Select customer</option>

              {availableCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.area ? ` — ${customer.area}` : ""}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={saving || !selectedCustomer}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}
              Add Customer
            </button>
          </form>

          {availableCustomers.length === 0 && (
            <p className="mt-3 text-xs text-[#8299A5]">
              No unassigned customers available.
            </p>
          )}
        </section>

        {/* GROUP CUSTOMERS TABLE */}

        <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">
          <div className="border-b border-[#DCE8EA] px-5 py-4">
            <h2 className="font-bold text-[#102D3A]">
              Group Customers
            </h2>

            <p className="mt-1 text-xs text-[#8299A5]">
              {groupCustomers.length} assigned customers
            </p>
          </div>

          {groupCustomers.length === 0 ? (
            <div className="py-14 text-center">
              <Users
                size={32}
                className="mx-auto text-[#087F8C]"
              />

              <p className="mt-3 font-semibold text-[#102D3A]">
                No customers assigned
              </p>

              <p className="mt-1 text-sm text-[#8299A5]">
                Select a customer above to add them to this group.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-[#EDF2F6] text-[#607987]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Customer
                    </th>

                    <th className="px-4 py-4 font-semibold">
                      Phone
                    </th>

                    <th className="px-4 py-4 text-right font-semibold">
                      Balance Jar
                    </th>

                    <th className="px-4 py-4 text-right font-semibold">
                      Due
                    </th>

                    <th className="px-4 py-4 text-right font-semibold">
                      Advance
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DCE8EA]">
                  {groupCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-[#F8FAFB]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#102D3A]">
                          {customer.name}
                        </p>

                        <p className="mt-1 text-xs text-[#8299A5]">
                          {customer.area || "Area not specified"}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-[#607987]">
                        {customer.phone || "—"}
                      </td>

                      <td className="px-4 py-4 text-right font-semibold">
                        {customer.jarBalance ?? 0}
                      </td>

                      <td className="px-4 py-4 text-right text-red-600">
                        {currency(customer.due)}
                      </td>

                      <td className="px-4 py-4 text-right text-[#087F8C]">
                        {currency(customer.advance)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void handleRemoveCustomer(customer)
                          }
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
          )}
        </section>
      </div>
    </main>
  );
}
