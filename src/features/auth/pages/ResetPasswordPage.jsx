import { useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, Mail, LockKeyhole, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authService } from "../services/authService";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "request") {
        await authService.requestPasswordReset(email);
        setSuccess("If this email belongs to an account, a password reset link will be sent. Check your inbox and spam folder.");
      } else {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        await authService.updatePassword(password);
        setSuccess("Password updated successfully. You can now sign in.");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (e) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><Droplets size={26} /></div>
          <div><h1 className="text-xl font-bold text-slate-900">Amrit Jal</h1><p className="text-sm text-slate-500">Account recovery</p></div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{mode === "request" ? "Reset your password" : "Choose a new password"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{mode === "request" ? "Enter your account email and we’ll send a secure reset link." : "Use at least 8 characters for your new password."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "request" ? (
            <label className="block text-sm font-medium text-slate-700">Email address
              <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                <Mail size={18} className="text-slate-400" />
                <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="min-w-0 flex-1 py-3 outline-none" placeholder="you@example.com" />
              </span>
            </label>
          ) : (
            <>
              <label className="block text-sm font-medium text-slate-700">New password
                <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><LockKeyhole size={18} className="text-slate-400" /><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="min-w-0 flex-1 py-3 outline-none" /></span>
              </label>
              <label className="block text-sm font-medium text-slate-700">Confirm password
                <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3"><LockKeyhole size={18} className="text-slate-400" /><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="min-w-0 flex-1 py-3 outline-none" /></span>
              </label>
            </>
          )}
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {success && <p role="status" className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={18} className="shrink-0" />{success}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Please wait…" : mode === "request" ? "Send reset link" : "Update password"}</button>
        </form>
        {mode === "request" && <button type="button" onClick={() => { setMode("update"); setError(""); setSuccess(""); }} className="mt-4 w-full text-sm font-medium text-cyan-800 hover:underline">Already opened the reset link? Set a new password</button>}
        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft size={16} /> Back to sign in</Link>
      </section>
    </main>
  );
}
