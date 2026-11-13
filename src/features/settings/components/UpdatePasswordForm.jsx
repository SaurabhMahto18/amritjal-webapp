
import { useState } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

const INITIAL_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const INPUT_CLASS =
  "w-full rounded-xl border border-[#DCE8EA] bg-white px-4 py-3 pr-12 text-sm text-[#102D3A] outline-none transition placeholder:text-[#8299A5] focus:border-[#087F8C] focus:ring-4 focus:ring-[#087F8C]/10";

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  error,
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-[#102D3A]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "currentPassword"
              ? "current-password"
              : "new-password"
          }
          className={`${INPUT_CLASS} ${
            error ? "border-red-400 focus:border-red-500" : ""
          }`}
          aria-invalid={Boolean(error)}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8299A5] transition hover:text-[#087F8C]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export default function UpdatePasswordForm() {
  const [form, setForm] = useState(INITIAL_FORM);

  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setStatus("idle");
    setMessage("");
  }

  function toggleVisibility(field) {
    setVisible((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  const passwordChecks = [
    {
      label: "At least 8 characters",
      valid: form.newPassword.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(form.newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(form.newPassword),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(form.newPassword),
    },
  ];

  function validate() {
    const nextErrors = {};

    if (!form.currentPassword) {
      nextErrors.currentPassword = "Enter your current password.";
    }

    if (!form.newPassword) {
      nextErrors.newPassword = "Enter your new password.";
    } else {
      if (form.newPassword.length < 8) {
        nextErrors.newPassword =
          "Password must contain at least 8 characters.";
      } else if (!/[A-Z]/.test(form.newPassword)) {
        nextErrors.newPassword =
          "Include at least one uppercase letter.";
      } else if (!/[a-z]/.test(form.newPassword)) {
        nextErrors.newPassword =
          "Include at least one lowercase letter.";
      } else if (!/[0-9]/.test(form.newPassword)) {
        nextErrors.newPassword =
          "Include at least one number.";
      }
    }

    if (
      form.currentPassword &&
      form.newPassword &&
      form.currentPassword === form.newPassword
    ) {
      nextErrors.newPassword =
        "New password must differ from current password.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus("idle");
    setMessage("");

    if (!validate()) {
      setStatus("error");
      return;
    }

    setLoading(true);

    try {
      // Verify the logged-in user.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user?.email) {
        throw new Error(
          "Your account email could not be verified. Please sign in again."
        );
      }

      // Verify current password before changing it.
      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: form.currentPassword,
        });

      if (verifyError) {
        throw new Error("Your current password is incorrect.");
      }

      // Update password through Supabase Auth.
      const { error: updateError } =
        await supabase.auth.updateUser({
          password: form.newPassword,
        });

      if (updateError) throw updateError;

      setForm(INITIAL_FORM);
      setErrors({});

      setVisible({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });

      setStatus("success");
      setMessage("Your password has been updated successfully.");
    } catch (error) {
      console.error("Password update failed:", error);

      setStatus("error");
      setMessage(
        error.message || "Unable to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setErrors({});
    setVisible({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
    setStatus("idle");
    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[#DCE8EA] bg-white shadow-sm">

        {/* Header */}
        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#DDF4F1] text-[#087F8C]">
              <LockKeyhole size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#102D3A]">
                Update Password
              </h2>

              <p className="mt-1 text-sm text-[#8299A5]">
                Change the password used to access your Amrit Jal account.
              </p>
            </div>
          </div>

          <div className="my-6 border-t border-[#DCE8EA]" />

          {/* Security notice */}
          <div className="mb-7 flex items-start gap-3 rounded-xl border border-[#DCE8EA] bg-[#F3F7F8] p-4">
            <ShieldCheck
              size={22}
              className="mt-0.5 shrink-0 text-[#087F8C]"
            />

            <div>
              <p className="text-sm font-semibold text-[#102D3A]">
                Keep your account secure
              </p>

              <p className="mt-1 text-xs leading-5 text-[#8299A5]">
                Choose a strong, unique password. Never share your
                login credentials with anyone.
              </p>
            </div>
          </div>

          {/* Password fields */}
          <div className="max-w-xl space-y-6">

            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={(event) =>
                updateField("currentPassword", event.target.value)
              }
              visible={visible.currentPassword}
              onToggle={() =>
                toggleVisibility("currentPassword")
              }
              placeholder="Enter your current password"
              error={errors.currentPassword}
            />

            <PasswordField
              label="New Password"
              name="newPassword"
              value={form.newPassword}
              onChange={(event) =>
                updateField("newPassword", event.target.value)
              }
              visible={visible.newPassword}
              onToggle={() =>
                toggleVisibility("newPassword")
              }
              placeholder="Create a new password"
              error={errors.newPassword}
            />

            {/* Password requirements */}
            <div className="rounded-xl border border-[#DCE8EA] bg-[#F8FAFB] p-4">
              <p className="mb-3 text-xs font-bold text-[#102D3A]">
                Password requirements
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {passwordChecks.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 text-xs ${
                      item.valid
                        ? "text-[#087F8C]"
                        : "text-[#8299A5]"
                    }`}
                  >
                    {item.valid ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <span className="size-2 rounded-full bg-slate-300" />
                    )}

                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              visible={visible.confirmPassword}
              onToggle={() =>
                toggleVisibility("confirmPassword")
              }
              placeholder="Re-enter your new password"
              error={errors.confirmPassword}
            />
          </div>

          {/* Status */}
          {message && (
            <div
              role="status"
              className={`mt-6 flex items-start gap-2 rounded-xl border p-4 text-sm ${
                status === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status === "success" ? (
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0"
                />
              )}

              <span>{message}</span>
            </div>
          )}

          {status === "error" && !message && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} />
              Please correct the highlighted fields.
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#DCE8EA] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-[#8299A5]">
              <KeyRound size={15} />
              Your password is managed securely by Supabase Auth.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE8EA] bg-white px-4 py-3 text-sm font-semibold text-[#102D3A] hover:bg-[#F3F7F8] disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087F8C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066B76] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
