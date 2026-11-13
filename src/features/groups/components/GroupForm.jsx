
import { useEffect, useState } from "react";
import { Save, X, Users } from "lucide-react";

export default function GroupForm({
  initialData = null,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initialData?.name || "");
    setError("");
  }, [initialData]);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError("Please enter a group name.");
      return;
    }

    if (cleanName.length > 100) {
      setError("Group name cannot exceed 100 characters.");
      return;
    }

    setError("");

    const success = await onSubmit({ name: cleanName });

    if (success) {
      setName("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl bg-[#F3F7F8] p-4">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
          <Users size={22} />
        </div>

        <div>
          <h3 className="font-semibold text-[#102D3A]">
            {initialData ? "Edit Group" : "Create New Group"}
          </h3>
          <p className="mt-1 text-xs text-[#8299A5]">
            Organize customers by village, area or delivery route.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="groupName"
          className="mb-2 block text-sm font-semibold text-[#102D3A]"
        >
          Group Name <span className="text-red-500">*</span>
        </label>

        <input
          id="groupName"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          placeholder="e.g. Bind Block"
          maxLength={100}
          autoFocus
          className="w-full rounded-xl border border-[#DCE8EA] px-4 py-3 text-sm text-[#102D3A] outline-none placeholder:text-[#8299A5] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10"
        />

        <p className="mt-1 text-right text-xs text-[#8299A5]">
          {name.length}/100
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-[#DCE8EA] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE8EA] px-4 py-3 text-sm font-semibold text-[#102D3A] hover:bg-[#F3F7F8] disabled:opacity-50"
        >
          <X size={16} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white hover:bg-[#066B76] disabled:opacity-50"
        >
          <Save size={16} />
          {saving
            ? "Saving..."
            : initialData
              ? "Update Group"
              : "Create Group"}
        </button>
      </div>
    </form>
  );
}
