
import { useCallback, useEffect, useState } from "react";

import {
  FileText,
  Upload,
  ExternalLink,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  CheckCircle2,
  RotateCcw,
  FileImage,
  File,
} from "lucide-react";

import { employeeService } from "../services/employeeService";

import {
  Empty,
  ErrorText,
  LoadingButton,
  Panel,
  StatusPill,
  dateLabel,
} from "./shared";

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

const documentTypes = [
  { value: "identity", label: "Identity Proof" },
  { value: "address_proof", label: "Address Proof" },
  { value: "photo", label: "Employee Photo" },
  { value: "agreement", label: "Agreement" },
  { value: "other", label: "Other Document" },
];

const initial = () => ({
  document_type: "identity",
  title: "",
});

function formatSize(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith("image/")) {
    return <FileImage size={22} />;
  }

  if (mimeType === "application/pdf") {
    return <FileText size={22} />;
  }

  return <File size={22} />;
}

export default function EmployeeDocumentsTab({ employee }) {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(initial);

  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload dropdown closed by default
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");

      const result = await employeeService.documents(employee.id);

      setRows(result || []);
    } catch (e) {
      setError(e);
    }
  }, [employee.id]);

  useEffect(() => {
    load();
  }, [load]);

  function change(key, value) {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  }

  function resetForm() {
    setFile(null);
    setForm(initial());
  }

  async function upload(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!file) {
      setError("Please choose a document first.");
      return;
    }

    if (file.size <= 0) {
      setError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("File size must be 10 MB or less.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, PNG and WEBP files are allowed.");
      return;
    }

    setBusy(true);

    try {
      await employeeService.uploadDocument(
        employee.id,
        file,
        {
          document_type: form.document_type,
          title: form.title.trim() || file.name,
        }
      );

      resetForm();

      setSuccess("Employee document uploaded successfully.");

      setFormOpen(false);

      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(row) {
    setError("");

    try {
      // Service expects storage_path, not file_path
      if (!row.storage_path) {
        throw new Error("Document storage path is missing.");
      }

      const url = await employeeService.documentUrl(
        row.storage_path
      );

      // Open the signed private-storage URL
      const opened = window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

      if (!opened) {
        setSuccess("Document link generated. Allow pop-ups to open it.");
      }
    } catch (err) {
      setError(err);
    }
  }

  async function remove(row) {
    const confirmed = window.confirm(
      `Delete "${row.file_name || "this document"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(row.id);
    setError("");
    setSuccess("");

    try {
      await employeeService.deleteDocument(row.id);

      setSuccess("Document deleted successfully.");

      await load();
    } catch (err) {
      setError(err);
    } finally {
      setDeletingId(null);
    }
  }

  const totalSize = rows.reduce(
    (sum, row) => sum + Number(row.file_size || 0),
    0
  );

  return (
    <div className="space-y-5">

      <ErrorText error={error} />

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* DOCUMENT SUMMARY */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <FolderOpen size={17} />
            <span className="text-xs font-medium">Total documents</span>
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {rows.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <FileText size={17} />
            <span className="text-xs font-medium">Storage used</span>
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatSize(totalSize)}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-1">
          <div className="flex items-center gap-2 text-slate-500">
            <File size={17} />
            <span className="text-xs font-medium">Allowed formats</span>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            PDF, JPG, PNG, WEBP
          </p>
        </div>

      </div>

      {/* UPLOAD ACCORDION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <button
          type="button"
          onClick={() => {
            setFormOpen((old) => !old);
            setError("");
            setSuccess("");
          }}
          aria-expanded={formOpen}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
        >

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <Upload size={21} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Upload Employee Document
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Upload identity proof, address proof, photo or agreement
              </p>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-2">

            <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline">
              {formOpen ? "Close form" : "Upload document"}
            </span>

            {formOpen ? (
              <ChevronUp size={20} className="text-slate-500" />
            ) : (
              <ChevronDown size={20} className="text-slate-500" />
            )}

          </div>

        </button>

        {formOpen && (
          <div className="border-t border-slate-100 p-4 sm:p-5">

            <form onSubmit={upload} className="space-y-5">

              {/* DOCUMENT INFORMATION */}
              <section>

                <div className="mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Document Information
                  </h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  <label className="block text-sm font-medium text-slate-700">
                    Document Category

                    <select
                      value={form.document_type}
                      onChange={(e) =>
                        change("document_type", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >
                      {documentTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Document Title (Optional)

                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        change("title", e.target.value)
                      }
                      placeholder="e.g. Aadhaar Card Front"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                </div>

              </section>

              <div className="border-t border-slate-100" />

              {/* FILE SELECTION */}
              <section>

                <div className="mb-3 flex items-center gap-2">
                  <Upload size={18} className="text-cyan-700" />

                  <h4 className="font-semibold text-slate-800">
                    Select Document
                  </h4>
                </div>

                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40">

                  <Upload
                    size={25}
                    className="mx-auto text-slate-500"
                  />

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {file ? "Change selected file" : "Choose a document"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    PDF, JPG, JPEG, PNG or WEBP · Maximum 10 MB
                  </p>

                  <input
                    type="file"
                    required
                    accept={ACCEPT}
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null);
                      setError("");
                    }}
                    className="sr-only"
                  />

                </label>

                {file && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-cyan-100 bg-cyan-50 p-3">

                    <div className="rounded-lg bg-white p-2 text-cyan-700">
                      <FileIcon mimeType={file.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {file.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatSize(file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setFile(null)}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                      title="Remove selected file"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>
                )}

              </section>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <LoadingButton busy={busy}>
                  <Upload size={16} />
                  Upload Document
                </LoadingButton>

              </div>

            </form>

          </div>
        )}

      </div>

      {/* DOCUMENT LIST */}
      <Panel
        title="Employee Documents"
        subtitle={`${rows.length} document(s) stored`}
      >

        {rows.length ? (

          <div className="grid gap-3 md:grid-cols-2">

            {rows.map((row) => (

              <div
                key={row.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50"
              >

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                  <FileIcon mimeType={row.mime_type} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate font-semibold text-slate-800">
                    {row.title || row.file_name || "Employee document"}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {row.file_name || "Document"}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">

                    <StatusPill value={row.document_type || "other"} />

                    <span>
                      {dateLabel(row.created_at?.slice(0, 10))}
                    </span>

                    {row.file_size && (
                      <span>{formatSize(row.file_size)}</span>
                    )}

                  </div>

                </div>

                <div className="flex shrink-0 items-center gap-1">

                  <button
                    type="button"
                    onClick={() => openDocument(row)}
                    title="Open / Download"
                    className="rounded-lg p-2 text-cyan-800 transition hover:bg-cyan-50"
                  >
                    <Download size={17} />
                  </button>

                  <button
                    type="button"
                    disabled={busy || deletingId === row.id}
                    onClick={() => remove(row)}
                    title="Delete document"
                    className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    {deletingId === row.id ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <Empty>
            No documents uploaded for this employee.
          </Empty>

        )}

      </Panel>

    </div>
  );
}
