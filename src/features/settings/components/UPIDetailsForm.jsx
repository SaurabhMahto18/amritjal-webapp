
import { useEffect, useRef, useState } from "react";
import {
  QrCode,
  Save,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  LoaderCircle,
  Image as ImageIcon,
  Trash2,
  Building2,
  Upload,
  X,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

const BUCKET = "payment-qrs";

const INITIAL_FORM = {
  merchantName: "",
  upiId: "",
  upiPhone: "",
  qrUrl: "",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-[#DCE8EA] bg-white px-3.5 py-3 text-sm text-[#102D3A] outline-none transition placeholder:text-[#A3B3BA] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10";

function Field({ label, hint, children }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-sm font-medium text-[#506875]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-[#8299A5]">{hint}</span>
      )}
    </label>
  );
}

export default function UPIDetailsForm() {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [businessId, setBusinessId] = useState(null);
  const [userId, setUserId] = useState(null);

  const [qrPreview, setQrPreview] = useState("");
  const [selectedQr, setSelectedQr] = useState(null);
  const [removeQr, setRemoveQr] = useState(false);

  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const [copyState, setCopyState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing UPI details
  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Please sign in to continue.");

        const { data: business, error: businessError } =
          await supabase
            .from("businesses")
            .select("id, name")
            .eq("owner_id", user.id)
            .maybeSingle();

        if (businessError) throw businessError;

        if (!business) {
          throw new Error(
            "Create your Agency Profile before configuring UPI details."
          );
        }

        const { data: settings, error: settingsError } =
          await supabase
            .from("business_invoice_settings")
            .select("upi_id, upi_phone, payment_qr_url")
            .eq("business_id", business.id)
            .maybeSingle();

        if (settingsError) throw settingsError;
        if (cancelled) return;

        setBusinessId(business.id);
        setUserId(user.id);

        setForm({
          merchantName: business.name || "",
          upiId: settings?.upi_id || "",
          upiPhone: settings?.upi_phone || "",
          qrUrl: settings?.payment_qr_url || "",
        });

        setQrPreview(settings?.payment_qr_url || "");
      } catch (error) {
        if (!cancelled) {
          setErrors({
            general: error.message || "Unable to load UPI details.",
          });
          setSaveState("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setSaveState("idle");
  }

  // Validate UPI details
  function validate() {
    const nextErrors = {};

    if (form.upiId.trim()) {
      const upiPattern = /^[\w.-]{2,256}@[a-zA-Z0-9.-]{2,64}$/;

      if (!upiPattern.test(form.upiId.trim())) {
        nextErrors.upiId = "Enter a valid UPI ID, e.g. name@bank.";
      }
    }

    if (
      form.upiPhone.trim() &&
      !/^[6-9]\d{9}$/.test(form.upiPhone.trim())
    ) {
      nextErrors.upiPhone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  // Select QR image and show instant preview
  function handleQrUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors((current) => ({
        ...current,
        qr: "Choose a PNG, JPG or WebP image.",
      }));
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        qr: "QR image must be smaller than 3 MB.",
      }));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setSelectedQr(file);
      setQrPreview(String(reader.result || ""));
      setRemoveQr(false);

      setErrors((current) => ({
        ...current,
        qr: "",
        general: "",
      }));

      setSaveState("idle");
    };

    reader.onerror = () => {
      setErrors((current) => ({
        ...current,
        qr: "Unable to read this image. Please try another file.",
      }));
    };

    reader.readAsDataURL(file);
  }

  // Remove selected or saved QR
  function handleRemoveQr() {
    setSelectedQr(null);
    setQrPreview("");
    setRemoveQr(true);

    setErrors((current) => ({
      ...current,
      qr: "",
    }));

    setSaveState("idle");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Copy UPI ID
  async function handleCopyUpi() {
    if (!form.upiId.trim()) {
      setErrors((current) => ({
        ...current,
        upiId: "Enter a UPI ID before copying.",
      }));
      return;
    }

    try {
      await navigator.clipboard.writeText(form.upiId.trim());
      setCopyState(true);
      window.setTimeout(() => setCopyState(false), 1800);
    } catch {
      setErrors((current) => ({
        ...current,
        upiId: "Unable to copy. Please copy the UPI ID manually.",
      }));
    }
  }

  // Upload QR image to Supabase Storage
  async function uploadQrImage(file) {
    const extensionByType = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };

    const extension = extensionByType[file.type];

    if (!extension) {
      throw new Error("Unsupported QR image format.");
    }

    const filePath =
      `${userId}/${businessId}/payment-qr-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Unable to generate QR image URL.");
    }

    return {
      url: data.publicUrl,
      path: filePath,
    };
  }

  // Save UPI details and QR URL
  async function handleSave(event) {
    event.preventDefault();

    if (!validate()) {
      setSaveState("error");
      return;
    }

    if (!businessId || !userId) {
      setErrors({
        general: "Business profile not found. Please reload the page.",
      });
      setSaveState("error");
      return;
    }

    setSaving(true);
    setSaveState("idle");
    setErrors({});

    let uploadedPath = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user || user.id !== userId) {
        throw new Error("Your session has expired. Sign in again.");
      }

      // Verify business ownership before saving
      const { data: business, error: businessError } =
        await supabase
          .from("businesses")
          .select("id")
          .eq("id", businessId)
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) throw businessError;
      if (!business) {
        throw new Error("Business ownership could not be verified.");
      }

      let qrUrl = form.qrUrl || null;

      // Upload new QR image if selected
      if (selectedQr) {
        const uploaded = await uploadQrImage(selectedQr);
        qrUrl = uploaded.url;
        uploadedPath = uploaded.path;
      }

      if (removeQr) {
        qrUrl = null;
      }

      const payload = {
        business_id: business.id,
        upi_id: form.upiId.trim() || null,
        upi_phone: form.upiPhone.trim() || null,
        payment_qr_url: qrUrl,
      };

      const { data: existing, error: readError } =
        await supabase
          .from("business_invoice_settings")
          .select("id")
          .eq("business_id", business.id)
          .maybeSingle();

      if (readError) throw readError;

      if (existing) {
        const { error } = await supabase
          .from("business_invoice_settings")
          .update({
            upi_id: payload.upi_id,
            upi_phone: payload.upi_phone,
            payment_qr_url: payload.payment_qr_url,
          })
          .eq("business_id", business.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_invoice_settings")
          .insert({
            ...payload,
            capsule_jar_charge: 200,
            thermal_jar_charge: 600,
            dispenser_jar_charge: 150,
          });

        if (error) throw error;
      }

      setForm((current) => ({
        ...current,
        qrUrl: qrUrl || "",
      }));

      setQrPreview(qrUrl || "");
      setSelectedQr(null);
      setRemoveQr(false);
      setSaveState("saved");
    } catch (error) {
      // Clean up newly uploaded image if database save failed
      if (uploadedPath) {
        await supabase.storage
          .from(BUCKET)
          .remove([uploadedPath]);
      }

      setSaveState("error");

      setErrors({
        general: error.message || "Unable to save UPI details.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-2xl border border-[#DCE8EA] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-[#506875]">
          <LoaderCircle
            size={20}
            className="animate-spin text-[#087F8C]"
          />
          Loading UPI details...
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <section className="rounded-2xl border border-[#DCE8EA] bg-white p-6 shadow-[0_3px_12px_rgba(16,45,58,0.04)] sm:p-10">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#DCE8EA] pb-5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
            <QrCode size={23} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#102D3A]">
              UPI Details
            </h2>
            <p className="mt-1 text-sm text-[#8299A5]">
              Configure digital payments for customer invoices.
            </p>
          </div>
        </div>

        {/* Merchant Name */}
        <div className="mt-7">
          <Field label="Merchant / Business Name">
            <div className="flex items-center gap-3 rounded-lg border border-[#DCE8EA] bg-[#F0F6F7] px-3.5 py-3">
              <Building2 size={18} className="shrink-0 text-[#087F8C]" />
              <span className="text-sm font-medium text-[#405866]">
                {form.merchantName || "Agency name not available"}
              </span>
            </div>
          </Field>
          <p className="mt-1 text-xs text-[#8299A5]">
            Automatically linked to your Agency Profile.
          </p>
        </div>

        {/* UPI Details */}
        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="UPI ID" hint="Example: businessname@bank">
              <div className="flex gap-2">
                <input
                  value={form.upiId}
                  onChange={(event) =>
                    updateField("upiId", event.target.value.trimStart())
                  }
                  placeholder="Enter your UPI ID"
                  className={`${INPUT_CLASS} min-w-0 flex-1`}
                  autoComplete="off"
                  spellCheck={false}
                />

                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#DCE8EA] px-4 text-sm font-semibold text-[#087F8C] transition hover:bg-[#EFF9F7]"
                >
                  {copyState ? <Check size={16} /> : <Copy size={16} />}
                  {copyState ? "Copied" : "Copy"}
                </button>
              </div>

              {errors.upiId && (
                <span className="text-xs text-red-600">
                  {errors.upiId}
                </span>
              )}
            </Field>
          </div>

          <Field
            label="UPI Mobile Number"
            hint="Optional · 10-digit Indian mobile number"
          >
            <div className="relative">
              <Smartphone
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8299A5]"
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.upiPhone}
                onChange={(event) =>
                  updateField(
                    "upiPhone",
                    event.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="Enter UPI mobile number"
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>

            {errors.upiPhone && (
              <span className="text-xs text-red-600">
                {errors.upiPhone}
              </span>
            )}
          </Field>
        </div>

        {/* QR Upload */}
        <div className="mt-8 border-t border-[#DCE8EA] pt-7">
          <div>
            <h3 className="text-base font-bold text-[#102D3A]">
              Payment QR Code
            </h3>
            <p className="mt-1 text-sm text-[#8299A5]">
              Upload your business UPI QR code. It will be saved for future invoices.
            </p>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">

            {/* Upload Area */}
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#B8D5D8] bg-[#F6FAFA] p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
                <Upload size={22} />
              </div>

              <p className="mt-3 text-sm font-semibold text-[#102D3A]">
                Upload payment QR image
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8299A5]">
                PNG, JPG or WebP · Maximum 3 MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleQrUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#087F8C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066A75] disabled:opacity-50"
              >
                <Upload size={16} />
                Choose QR Image
              </button>

              {selectedQr && (
                <p className="mt-3 max-w-full break-all text-xs text-[#087F8C]">
                  Selected: {selectedQr.name}
                </p>
              )}

              {qrPreview && (
                <button
                  type="button"
                  onClick={handleRemoveQr}
                  disabled={saving}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  <Trash2 size={15} />
                  Remove QR
                </button>
              )}

              {errors.qr && (
                <p className="mt-3 text-xs text-red-600">
                  {errors.qr}
                </p>
              )}
            </div>

            {/* Live Preview */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#DCE8EA] bg-white p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8299A5]">
                QR Preview
              </p>

              <div className="flex aspect-square w-full max-w-40 items-center justify-center overflow-hidden rounded-xl border border-[#DCE8EA] bg-[#F6FAFA]">
                {qrPreview ? (
                  <img
                    src={qrPreview}
                    alt="Payment QR code preview"
                    className="size-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon
                      size={34}
                      className="mx-auto text-[#B3C5CB]"
                    />
                    <p className="mt-2 text-xs text-[#8299A5]">
                      No QR uploaded
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-3 text-center text-xs text-[#8299A5]">
                Preview your payment QR before saving.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {errors.general && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {saveState === "saved" && (
          <div
            role="status"
            className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            <CheckCircle2 size={18} />
            UPI details and QR image saved successfully.
          </div>
        )}

        {/* Save */}
        <div className="mt-7 flex justify-end border-t border-[#DCE8EA] pt-5">
          <button
            type="submit"
            disabled={saving || !businessId}
            className="inline-flex items-center gap-2 rounded-lg bg-[#087F8C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#066A75] focus:outline-none focus:ring-4 focus:ring-[#087F8C]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save UPI Details"}
          </button>
        </div>
      </section>
    </form>
  );
}
