
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Droplets,
  Mail,
  LockKeyhole,
  LoaderCircle,
  ArrowRight,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Waves,
  CircleCheck,
} from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";

export default function SignupPage() {
  const { signUp } = useAuthContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password kam se kam 8 characters ka hona chahiye.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Dono passwords match nahi kar rahe.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email.trim(), password);

      if (result.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setSuccess(
          "Account request submit ho gayi. Email confirmation enabled hai to apna email verify karein."
        );
      }
    } catch (err) {
      setError(err.message || "Account create nahi ho paya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3fbff] text-slate-800">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* Left: Water brand section */}
        <section className="hidden lg:block">
          <Link to="/login" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-200">
              <Droplets size={27} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Amrit<span className="text-cyan-600"> Jal</span>
              </h1>
              <p className="text-xs font-medium tracking-widest text-slate-500">
                WATER BUSINESS MANAGEMENT
              </p>
            </div>
          </Link>

          <div className="mt-12 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm">
              <Waves size={17} />
              Smart water delivery management
            </span>

            <h2 className="mt-7 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 xl:text-6xl">
              Your water business.
              <span className="mt-2 block text-cyan-600">
                Flowing better.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Customers, jar deliveries aur payments ko ek hi jagah manage
              karein. Apne water supply business ko organized banayein.
            </p>
          </div>

          {/* Water bottle illustration */}
          <div className="relative mt-9 flex min-h-[280px] items-center justify-center overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-200 p-8">
            <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-white/40" />
            <div className="absolute -right-5 top-4 h-32 w-32 rounded-full bg-cyan-300/30" />

            <div className="relative flex items-center gap-7">
              <div className="flex h-44 w-28 items-center justify-center rounded-[2rem] rounded-t-3xl border-4 border-white/90 bg-gradient-to-b from-blue-300/90 to-cyan-600/90 shadow-xl shadow-blue-400/30">
                <div className="flex h-24 w-20 flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-cyan-700">
                  <Droplets size={29} />
                  <span className="mt-1 text-xs font-extrabold">AMRIT JAL</span>
                  <span className="text-[9px] tracking-widest">PURE WATER</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-blue-900/5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Daily deliveries
                      </p>
                      <p className="text-xs text-slate-500">
                        Stay organized
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-blue-900/5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                      <Truck size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Easy management
                      </p>
                      <p className="text-xs text-slate-500">
                        Customers & payments
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Droplets className="absolute bottom-5 left-6 text-white/70" size={30} />
            <Droplets className="absolute right-8 top-7 text-white/80" size={22} />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyan-700" />
              Secure account
            </span>
            <span className="flex items-center gap-2">
              <CircleCheck size={18} className="text-cyan-700" />
              Simple setup
            </span>
          </div>
        </section>

        {/* Right: Signup form */}
        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-200">
              <Droplets size={27} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Amrit<span className="text-cyan-600"> Jal</span>
              </h1>
              <p className="text-xs text-slate-500">
                Water business management
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-2xl shadow-cyan-900/5 sm:p-9">
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Droplets size={25} />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
                Get started
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Apna account banayein aur apne water business ko manage karna
                shuru karein.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="signup-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-50">
                  <Mail size={19} className="shrink-0 text-slate-400" />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-50">
                  <LockKeyhole size={19} className="shrink-0 text-slate-400" />
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-50">
                  <LockKeyhole size={19} className="shrink-0 text-slate-400" />
                  <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter password again"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </p>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800"
                >
                  {success}
                  <div className="mt-2">
                    <Link
                      to="/login"
                      className="font-bold underline underline-offset-2"
                    >
                      Go to login
                    </Link>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs text-slate-400">ALREADY REGISTERED?</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <Link
              to="/login"
              className="flex w-full items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:border-cyan-200 hover:bg-cyan-50"
            >
              Login to your account
            </Link>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            By creating an account, you can start organizing your water
            delivery business with Amrit Jal.
          </p>
        </section>
      </div>
    </main>
  );
}
