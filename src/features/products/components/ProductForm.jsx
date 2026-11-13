
import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

const initialForm = {
  name: "",
  sku: "",
  category: "water",
  costPrice: "",
  sellingPrice: "",
  stockQuantity: "0",
  unit: "jar",
  description: "",
};

const categories = [
  { value: "water", label: "Water" },
  { value: "jar", label: "Jars and Containers" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100";

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialData) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: initialData.name || "",
      sku: initialData.sku || "",
      category: initialData.category || "other",
      costPrice: String(initialData.costPrice ?? ""),
      sellingPrice: String(initialData.sellingPrice ?? ""),
      stockQuantity: String(initialData.stockQuantity ?? 0),
      unit: initialData.unit || "jar",
      description: initialData.description || "",
    });
  }, [initialData]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (
      form.sellingPrice === "" ||
      !Number.isFinite(Number(form.sellingPrice)) ||
      Number(form.sellingPrice) < 0
    ) {
      setError("Enter a valid selling price.");
      return;
    }

    if (
      form.costPrice === "" ||
      !Number.isFinite(Number(form.costPrice)) ||
      Number(form.costPrice) < 0
    ) {
      setError("Enter a valid cost price.");
      return;
    }

    if (
      form.stockQuantity === "" ||
      !Number.isInteger(Number(form.stockQuantity)) ||
      Number(form.stockQuantity) < 0
    ) {
      setError("Stock quantity must be a non-negative whole number.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity),
      });
    } catch (err) {
      setError(err.message || "Unable to save product.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Product Name *">
          <input
            name="name"
            value={form.name}
            onChange={updateField}
            required
            maxLength={150}
            disabled={saving}
            className={inputClass}
            placeholder="Enter product name"
          />
        </Field>

        <Field label="SKU / Product Code">
          <input
            name="sku"
            value={form.sku}
            onChange={updateField}
            maxLength={80}
            disabled={saving}
            className={inputClass}
            placeholder="Optional product code"
          />
        </Field>

        <Field label="Category">
          <select
            name="category"
            value={form.category}
            onChange={updateField}
            disabled={saving}
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Unit">
          <select
            name="unit"
            value={form.unit}
            onChange={updateField}
            disabled={saving}
            className={inputClass}
          >
            <option value="jar">Jar</option>
            <option value="bottle">Bottle</option>
            <option value="piece">Piece</option>
            <option value="pack">Pack</option>
            <option value="unit">Unit</option>
          </select>
        </Field>

        <Field label="Cost Price (₹) *">
          <input
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={updateField}
            required
            disabled={saving}
            className={inputClass}
            placeholder="0.00"
          />
        </Field>

        <Field label="Selling Price (₹) *">
          <input
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={updateField}
            required
            disabled={saving}
            className={inputClass}
            placeholder="0.00"
          />
        </Field>

        <Field label="Current Stock *">
          <input
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            value={form.stockQuantity}
            onChange={updateField}
            required
            disabled={saving}
            className={inputClass}
            placeholder="0"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={3}
              maxLength={1000}
              disabled={saving}
              className={inputClass}
              placeholder="Optional product details"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <X size={17} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Saving..." : initialData ? "Update Product" : "Save Product"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
