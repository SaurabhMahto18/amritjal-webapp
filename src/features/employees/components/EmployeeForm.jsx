import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  phone: "",
  role: "delivery_boy",
  address: "",
  joining_date: new Date().toISOString().slice(0, 10),
  monthly_salary: "",
  status: "active",
  notes: "",
};

export default function EmployeeForm({
  employee,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      ...initialForm,
      ...employee,
      monthly_salary: employee?.monthly_salary ?? "",
    });
  }, [employee]);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await onSave({
        ...form,
        id: employee?.id,
      });
    } catch (err) {
      setError(err.message || "Could not save employee.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Employee Name *

          <input
            required
            maxLength={120}
            className={inputClass}
            value={form.name}
            onChange={(e) =>
              update("name", e.target.value)
            }
          />
        </label>

        <label className="text-sm">
          Mobile Number *

          <input
            required
            inputMode="tel"
            className={inputClass}
            value={form.phone}
            onChange={(e) =>
              update("phone", e.target.value)
            }
          />
        </label>

        <label className="text-sm">
          Employee Role

          <select
            className={inputClass}
            value={form.role}
            onChange={(e) =>
              update("role", e.target.value)
            }
          >
            <option value="driver">Driver</option>
            <option value="delivery_boy">Delivery Boy</option>
            <option value="helper">Helper</option>
            <option value="manager">Manager</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="text-sm">
          Joining Date *

          <input
            required
            type="date"
            className={inputClass}
            value={form.joining_date || ""}
            onChange={(e) =>
              update("joining_date", e.target.value)
            }
          />
        </label>

        <label className="text-sm">
          Fixed Monthly Salary (₹) *

          <input
            required
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            value={form.monthly_salary}
            onChange={(e) =>
              update("monthly_salary", e.target.value)
            }
          />
        </label>

        <label className="text-sm">
          Status

          <select
            className={inputClass}
            value={form.status}
            onChange={(e) =>
              update("status", e.target.value)
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        Address

        <textarea
          rows="2"
          className={inputClass}
          value={form.address || ""}
          onChange={(e) =>
            update("address", e.target.value)
          }
        />
      </label>

      <label className="block text-sm">
        Notes

        <textarea
          rows="2"
          className={inputClass}
          value={form.notes || ""}
          onChange={(e) =>
            update("notes", e.target.value)
          }
        />
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Employee"}
        </button>
      </div>
    </form>
  );
}