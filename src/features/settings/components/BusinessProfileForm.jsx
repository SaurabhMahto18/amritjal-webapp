
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Save,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  getAgencyProfile,
  saveAgencyProfile,
  uploadAgencyLogo,
} from "../services/settingsService";

const INITIAL_FORM = {
  name: "",
  phone: "",
  address: "",
  gstNumber: "",
  panNumber: "",
  registrationNumber: "",
  email: "",
  logoUrl: "",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-[#DCE8EA] bg-white px-3.5 py-3 text-sm text-[#102D3A] outline-none transition placeholder:text-[#A3B3BA] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10";

function FormField({ label, required = false, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-[#506875]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function BusinessProfileForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [businessId, setBusinessId] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [selectedLogo, setSelectedLogo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing agency profile
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAgencyProfile();

      const business = result.business;
      const settings = result.settings || {};

      setBusinessId(business.id);

      const logoUrl = settings.business_logo_url || "";

      setForm({
        name: business.name || "",
        phone: settings.business_phone || "",
        address: settings.business_address || "",
        gstNumber: business.gst_number || "",
        panNumber: business.pan_number || "",
        registrationNumber: business.registration_number || "",
        email: result.email || "",
        logoUrl,
      });

      setLogoPreview(logoUrl);
      setSelectedLogo(null);
    } catch (err) {
      setError(
        err.message || "Unable to load agency profile."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Update form fields
  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  // Select and preview agency logo
  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setLogoError("Choose a PNG, JPG or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Image must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setLogoPreview(String(reader.result || ""));
      setSelectedLogo(file);
      setLogoError("");
      setError("");
      setSuccess("");
    };

    reader.onerror = () => {
      setLogoError("Unable to read this image. Please try another file.");
    };

    reader.readAsDataURL(file);
  }

  // Cancel selected logo change
  function cancelLogoChange() {
    setLogoPreview(form.logoUrl);
    setSelectedLogo(null);
    setLogoError("");
  }

  // Save agency profile
  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Agency name is required.");
      return;
    }

    if (!businessId) {
      setError("Business profile could not be identified. Please reload.");
      return;
    }

    setSaving(true);

    try {
      let savedLogoUrl = form.logoUrl;

      // Upload new logo only if selected
      if (selectedLogo) {
        savedLogoUrl = await uploadAgencyLogo(
          selectedLogo,
          businessId
        );
      }

      // Save profile using database RPC
      await saveAgencyProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
        registrationNumber: form.registrationNumber,
        logoUrl: savedLogoUrl,
      });

      setForm((current) => ({
        ...current,
        logoUrl: savedLogoUrl || "",
      }));

      setLogoPreview(savedLogoUrl || "");
      setSelectedLogo(null);

      setSuccess("Agency profile updated successfully.");

      // Notify other components about updated agency details
      window.dispatchEvent(
        new Event("amrit-jal-business-updated")
      );
    } catch (err) {
      setError(
        err.message || "Unable to save agency profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-[525px] items-center justify-center rounded-2xl border border-[#DCE8EA] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-[#506875]">
          <LoaderCircle
            size={21}
            className="animate-spin text-[#087F8C]"
          />
          Loading agency profile...
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <section className="rounded-2xl border border-[#DCE8EA] bg-white p-6 shadow-[0_3px_12px_rgba(16,45,58,0.04)] sm:p-10">

        {/* Header */}
        <div className="border-b border-[#DCE8EA] pb-5">
          <h2 className="text-xl font-bold text-[#102D3A]">
            Agency Profile
          </h2>

          <p className="mt-1 text-sm text-[#8299A5]">
            Your agency's identity and registration details.
          </p>
        </div>

        {/* Agency Logo */}
        <div className="mt-7">
          <div className="flex flex-wrap items-center gap-4">

            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DCE8EA] bg-white shadow-sm">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Agency logo"
                  className="size-full object-contain p-1"
                />
              ) : (
                <ImageIcon
                  size={30}
                  className="text-[#087F8C]"
                />
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-[#647B89]">
                Profile Image
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#087F8C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066A75]">
                  <Upload size={16} />
                  Choose file

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                    disabled={saving}
                    className="sr-only"
                  />
                </label>

                {selectedLogo && (
                  <button
                    type="button"
                    onClick={cancelLogoChange}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                )}
              </div>

              <p className="mt-1 text-xs text-[#8299A5]">
                PNG, JPG or WebP · Maximum 2 MB
              </p>
            </div>
          </div>

          {logoError && (
            <p className="mt-2 text-xs text-red-600">
              {logoError}
            </p>
          )}
        </div>

        {/* Agency Information */}
        <div className="mt-7 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">

          {/* Agency Name */}
          <FormField label="Agency Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              placeholder="Enter agency name"
              maxLength={120}
              required
              disabled={saving}
              className={INPUT_CLASS}
            />
          </FormField>

          {/* Contact Number */}
          <FormField label="Contact Number">
            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                updateField("phone", event.target.value)
              }
              placeholder="Enter contact number"
              maxLength={40}
              disabled={saving}
              className={INPUT_CLASS}
            />
          </FormField>

          {/* Address */}
          <div className="sm:col-span-2">
            <FormField label="Address">
              <textarea
                rows={2}
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
                placeholder="Enter complete agency address"
                maxLength={500}
                disabled={saving}
                className={`${INPUT_CLASS} resize-y`}
              />
            </FormField>
          </div>

          {/* GST */}
          <FormField label="GST No">
            <input
              type="text"
              value={form.gstNumber}
              onChange={(event) =>
                updateField(
                  "gstNumber",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="Enter GST number"
              maxLength={15}
              disabled={saving}
              className={INPUT_CLASS}
            />
          </FormField>

          {/* PAN */}
          <FormField label="PAN No">
            <input
              type="text"
              value={form.panNumber}
              onChange={(event) =>
                updateField(
                  "panNumber",
                  event.target.value.toUpperCase()
                )
              }
              placeholder="Enter PAN number"
              maxLength={10}
              disabled={saving}
              className={INPUT_CLASS}
            />
          </FormField>

          {/* Registration */}
          <div className="sm:col-span-2">
            <FormField label="Registration No">
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(event) =>
                  updateField(
                    "registrationNumber",
                    event.target.value
                  )
                }
                placeholder="Enter business registration number"
                maxLength={100}
                disabled={saving}
                className={INPUT_CLASS}
              />
            </FormField>
          </div>
        </div>

        {/* Email */}
        <div className="mt-3">
          <FormField label="Account Email">
            <input
              type="email"
              value={form.email}
              readOnly
              className={`${INPUT_CLASS} cursor-not-allowed bg-[#F0F6F7] text-[#8299A5]`}
            />
          </FormField>
          <p className="mt-1 text-xs text-[#8299A5]">
            Email is linked to your login account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-7 flex justify-end border-t border-[#DCE8EA] pt-5">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#087F8C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#066A75] focus:outline-none focus:ring-4 focus:ring-[#087F8C]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </section>
    </form>
  );
}
