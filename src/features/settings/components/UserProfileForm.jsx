
import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  Camera,
  Save,
  Phone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Mail,
  LoaderCircle,
} from "lucide-react";

import { supabase } from "../../../lib/supabase/client";
import { useAuth } from "../../auth/hooks/useAuth";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

function Field({ label, required, children, error }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}

      {error && (
        <span className="block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

export default function UserProfileForm() {
  const { user, loading: authLoading, refreshSession } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    mobileNumber: "",
    employeeRole: "",
    otpMethod: "sms",
  });

  const [profileImage, setProfileImage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const metadata = user.user_metadata || {};

    setForm({
      fullName: metadata.full_name || metadata.fullName || "",
      mobileNumber: metadata.mobile_number || "",
      employeeRole: metadata.employee_role || "",
      otpMethod: metadata.otp_method || "sms",
    });

    setProfileImage(metadata.avatar_url || "");
    setLoading(false);
  }, [user, authLoading]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setMessage("");
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({
        ...current,
        photo: "Please select a valid image.",
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        photo: "Image size must be below 2 MB.",
      }));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfileImage(String(reader.result || ""));
      setErrors((current) => ({
        ...current,
        photo: "",
      }));
    };

    reader.readAsDataURL(file);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!user) {
      setMessage("Please sign in again.");
      setMessageType("error");
      return;
    }

    const nextErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (
      form.mobileNumber.trim() &&
      !/^[+()\-\s\d]{7,20}$/.test(form.mobileNumber.trim())
    ) {
      nextErrors.mobileNumber = "Enter a valid mobile number.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please correct the highlighted fields.");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: form.fullName.trim(),
          mobile_number: form.mobileNumber.trim(),
          employee_role: form.employeeRole.trim(),
          otp_method: form.otpMethod,
        },
      });

      if (error) throw error;

      await refreshSession();

      setMessage("Profile details updated successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to update profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoaderCircle className="animate-spin text-teal-700" size={28} />
        <span className="ml-3 text-sm text-slate-500">
          Loading profile...
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-100 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <UserRound size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                User Profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage your personal account information.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-7">
          {/* Profile Image */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-teal-50 bg-slate-100 text-slate-400">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile preview"
                  className="size-full object-cover"
                />
              ) : (
                <UserRound size={42} />
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                Profile Image
              </p>

              <p className="mt-1 text-xs text-slate-500">
                JPG, PNG or WebP. Maximum 2 MB.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                <Camera size={16} />
                Choose Photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {errors.photo && (
                <p className="mt-2 text-xs text-red-600">
                  {errors.photo}
                </p>
              )}

              <p className="mt-2 text-xs text-amber-700">
                Photo preview only. Permanent upload will be connected
                after Storage configuration.
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="font-semibold text-slate-900">
              Personal Information
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Keep your account information accurate.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full Name"
              required
              error={errors.fullName}
            >
              <input
                value={form.fullName}
                onChange={(e) =>
                  updateField("fullName", e.target.value)
                }
                placeholder="Enter your full name"
                className={INPUT_CLASS}
                autoComplete="name"
              />
            </Field>

            <Field
              label="Mobile Number"
              error={errors.mobileNumber}
            >
              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="tel"
                  value={form.mobileNumber}
                  onChange={(e) =>
                    updateField("mobileNumber", e.target.value)
                  }
                  placeholder="Enter mobile number"
                  className={`${INPUT_CLASS} pl-10`}
                  autoComplete="tel"
                />
              </div>
            </Field>

            <Field label="Email Address">
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className={`${INPUT_CLASS} cursor-not-allowed bg-slate-50 pl-10 text-slate-500`}
                />
              </div>

              <span className="text-xs text-slate-500">
                Email is managed through your login account.
              </span>
            </Field>

            <Field label="Employee Role">
              <input
                value={form.employeeRole}
                onChange={(e) =>
                  updateField("employeeRole", e.target.value)
                }
                placeholder="e.g. Agency Owner"
                className={`${INPUT_CLASS} bg-slate-50`}
              />

              <span className="text-xs text-slate-500">
                Informational only. This field does not change permissions.
              </span>
            </Field>
          </div>

          {/* OTP Preference */}
          <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-teal-700" size={22} />

              <div>
                <h3 className="font-semibold text-slate-900">
                  Mobile Verification Preference
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Select your preferred OTP channel.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="radio"
                  name="otpMethod"
                  checked={form.otpMethod === "sms"}
                  onChange={() => updateField("otpMethod", "sms")}
                  className="size-4 accent-teal-700"
                />
                SMS
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="radio"
                  name="otpMethod"
                  checked={form.otpMethod === "whatsapp"}
                  onChange={() =>
                    updateField("otpMethod", "whatsapp")
                  }
                  className="size-4 accent-teal-700"
                />
                WhatsApp
              </label>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              OTP delivery requires a connected verification provider.
            </p>
          </div>

          {/* Status */}
          {message && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 size={19} />
              ) : (
                <AlertCircle size={19} />
              )}

              {message}
            </div>
          )}

          {/* Save */}
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
