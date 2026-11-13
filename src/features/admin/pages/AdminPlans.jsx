
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminPlanService } from "../services/adminPlanService";
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  X,
  Check,
  Layers,
  Users,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Power,
} from "lucide-react";

const EMPTY_FORM = {
  code: "",
  name: "",
  max_customers: "",
  price_monthly: "",
  price_yearly: "",
  is_custom: false,
  is_active: true,
};

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-[#E3E0D6] bg-white px-3 text-sm text-[#24262B] outline-none transition placeholder:text-slate-400 focus:border-[#C6A82D] focus:ring-4 focus:ring-[#E9CA43]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

function money(value) {
  if (value === null || value === undefined) return "Custom";

  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function Field({ label, hint, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs text-slate-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#24262B]">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {detail}
          </p>
        </div>

        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={21} />
        </span>
      </div>
    </div>
  );
}

function Notice({ notice, onClose }) {
  if (!notice) return null;

  const success = notice.type === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <span className="flex-1">{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss">
        <X size={17} />
      </button>
    </div>
  );
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [notice, setNotice] = useState(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);

    try {
      const rows = await adminPlanService.getPlans();
      setPlans(rows);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to load subscription plans.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        `${plan.name} ${plan.code}`.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.is_active) ||
        (statusFilter === "inactive" && !plan.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const activeCount = plans.filter((plan) => plan.is_active).length;
  const customCount = plans.filter((plan) => plan.is_custom).length;

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openCreate() {
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM });
    setNotice(null);
    setEditorOpen(true);
  }

  function openEdit(plan) {
    setEditingPlan(plan);

    setForm({
      code: plan.code || "",
      name: plan.name || "",
      max_customers: plan.max_customers ?? "",
      price_monthly: plan.price_monthly ?? "",
      price_yearly: plan.price_yearly ?? "",
      is_custom: Boolean(plan.is_custom),
      is_active: Boolean(plan.is_active),
    });

    setNotice(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    if (saving) return;

    setEditorOpen(false);
    setEditingPlan(null);
    setForm({ ...EMPTY_FORM });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setNotice(null);

    try {
      const saved = await adminPlanService.savePlan(
        form,
        editingPlan?.id || null
      );

      setEditorOpen(false);
      setEditingPlan(null);
      setForm({ ...EMPTY_FORM });

      setNotice({
        type: "success",
        text: `${saved.name} ${
          editingPlan ? "updated" : "created"
        } successfully.`,
      });

      await loadPlans();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to save plan.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(plan) {
    const nextStatus = !plan.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `${nextStatus ? "Activate" : "Deactivate"} ${plan.name}?`
    );

    if (!confirmed) return;

    setStatusBusy(plan.id);
    setNotice(null);

    try {
      const updated = await adminPlanService.setPlanStatus(
        plan.id,
        nextStatus
      );

      setPlans((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setNotice({
        type: "success",
        text: `${updated.name} ${action}d successfully.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Unable to update plan status.",
      });
    } finally {
      setStatusBusy("");
    }
  }

  useEffect(() => {
    if (!editorOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) {
        closeEditor();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorOpen, saving]);

  return (
    <main className="min-w-0 space-y-6 bg-[#F7F6F0]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#927719]">
            Platform Administration
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[#24262B] sm:text-3xl">
            Subscription Plans
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage the seven Amrit Jal subscription plans, pricing and customer limits.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadPlans}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E3E0D6] bg-white px-4 text-sm font-semibold text-[#34363B] hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#24262B] px-4 text-sm font-semibold text-white hover:bg-black"
          >
            <Plus size={17} />
            Add Plan
          </button>
        </div>
      </header>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Plans"
          value={plans.length}
          detail="Configured subscription plans"
          icon={Layers}
          tone="slate"
        />
        <StatCard
          label="Active Plans"
          value={activeCount}
          detail="Available for new subscriptions"
          icon={Check}
          tone="green"
        />
        <StatCard
          label="Inactive Plans"
          value={plans.length - activeCount}
          detail="Not available for new subscriptions"
          icon={Power}
          tone="amber"
        />
        <StatCard
          label="Custom Plans"
          value={customCount}
          detail="Custom pricing and limits"
          icon={Users}
          tone="blue"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#EDEAE0] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-[#24262B]">
              Plan Catalogue
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredPlans.length} plans found
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search plans..."
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${INPUT_CLASS} sm:w-36`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Layers size={30} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-semibold text-[#24262B]">
              No plans found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#F8F7F2] text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-bold">Plan</th>
                  <th className="px-5 py-4 font-bold">Customers</th>
                  <th className="px-5 py-4 font-bold">Monthly</th>
                  <th className="px-5 py-4 font-bold">Yearly</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-t border-[#F0EEE8] hover:bg-[#FCFBF8]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#24262B]">
                        {plan.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {plan.code}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {plan.is_custom || plan.max_customers == null
                        ? "Custom"
                        : `${Number(plan.max_customers).toLocaleString("en-IN")} customers`}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#24262B]">
                      {money(plan.price_monthly)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#24262B]">
                      {money(plan.price_yearly)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          plan.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            plan.is_active
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {plan.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(plan)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E3E0D6] px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={statusBusy === plan.id}
                          onClick={() => toggleStatus(plan)}
                          className={`h-9 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${
                            plan.is_active
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {statusBusy === plan.id
                            ? "Please wait..."
                            : plan.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editorOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeEditor();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-modal-title"
            className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#EDEAE0] bg-white shadow-2xl sm:rounded-3xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#EDEAE0] px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#927719]">
                  Plan Configuration
                </p>
                <h2
                  id="plan-modal-title"
                  className="mt-1 text-xl font-bold text-[#24262B]"
                >
                  {editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Configure plan pricing and customer capacity.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeEditor}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EDEAE0] text-slate-500 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              <div className="space-y-5 p-5 sm:p-7">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Plan Name">
                    <input
                      required
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      placeholder="e.g. Growth Starter"
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field
                    label="Plan Code"
                    hint={
                      editingPlan
                        ? "Existing plan codes cannot be changed."
                        : "Unique code, e.g. growth_starter"
                    }
                  >
                    <input
                      required
                      disabled={Boolean(editingPlan)}
                      value={form.code}
                      onChange={(event) =>
                        updateForm("code", event.target.value)
                      }
                      placeholder="growth_starter"
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Monthly Price (₹)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={form.is_custom}
                      value={form.price_monthly}
                      onChange={(event) =>
                        updateForm("price_monthly", event.target.value)
                      }
                      placeholder={form.is_custom ? "Custom" : "59"}
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <Field label="Yearly Price (₹)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={form.is_custom}
                      value={form.price_yearly}
                      onChange={(event) =>
                        updateForm("price_yearly", event.target.value)
                      }
                      placeholder={form.is_custom ? "Custom" : "590"}
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      label="Maximum Active Customers"
                      hint="Custom plans can have a negotiated customer limit."
                    >
                      <input
                        type="number"
                        min="1"
                        step="1"
                        disabled={form.is_custom}
                        value={form.max_customers}
                        onChange={(event) =>
                          updateForm("max_customers", event.target.value)
                        }
                        placeholder={form.is_custom ? "Custom" : "100"}
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-[#EDEAE0] bg-[#F8F7F2] p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.is_custom}
                      onChange={(event) =>
                        updateForm("is_custom", event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[#B89A22]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-[#24262B]">
                        Custom / Enterprise plan
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Pricing and customer limit are handled separately.
                      </span>
                    </span>
                  </label>

                  <div className="border-t border-[#E9E5D9]" />

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        updateForm("is_active", event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[#B89A22]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-[#24262B]">
                        Plan is active
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Active plans can be offered for new subscriptions.
                      </span>
                    </span>
                  </label>
                </div>

                {editingPlan && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                    Updating a plan changes its catalogue values. Existing
                    subscription and payment history is not automatically
                    rewritten. Review customer-limit impact before reducing
                    a limit.
                  </div>
                )}
              </div>

              <footer className="flex flex-col-reverse gap-2 border-t border-[#EDEAE0] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeEditor}
                  className="h-11 rounded-xl border border-[#E3E0D6] px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#24262B] px-5 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                >
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Check size={16} />
                      {editingPlan ? "Save Changes" : "Create Plan"}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
