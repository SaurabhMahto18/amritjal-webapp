
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Droplets,
  Mail,
  LockKeyhole,
  LoaderCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Truck,
  ShieldCheck,
  Waves,
  CheckCircle2,
} from "lucide-react";
import { useAuthContext } from "../providers/AuthProvider";

export default function LoginPage() {
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email.trim(), password);

      const destination = location.state?.from;
      navigate(
        destination
          ? `${destination.pathname || "/dashboard"}${destination.search || ""}${destination.hash || ""}`
          : "/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(err.message || "Login nahi ho paya. Details check karein.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3fbff] text-slate-800">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* Water brand section */}
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
              Every drop
              <span className="mt-2 block text-cyan-600">
                managed smarter.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              Customers, jar deliveries aur payments ko ek hi jagah manage
              karein. Apne water supply business par control rakhein.
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
                        Organized customers
                      </p>
                      <p className="text-xs text-slate-500">
                        Everything in one place
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
                        Smooth deliveries
                      </p>
                      <p className="text-xs text-slate-500">
                        Better daily workflow
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
              Secure login
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-cyan-700" />
              Simple management
            </span>
          </div>
        </section>

        {/* Login form */}
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
                Welcome back
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Login to Amrit Jal
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Apne account mein login karke business manage karein.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-50">
                  <Mail size={19} className="shrink-0 text-slate-400" />
                  <input
                    id="login-email"
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <Link
                    to="/reset-password"
                    className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-50">
                  <LockKeyhole size={19} className="shrink-0 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="shrink-0 text-slate-400 hover:text-cyan-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
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

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login to your account
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs text-slate-400">NEW TO AMRIT JAL?</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <Link
              to="/signup"
              className="flex w-full items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:border-cyan-200 hover:bg-cyan-50"
            >
              Create a new account
            </Link>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            Manage your water delivery business with Amrit Jal.
          </p>
        </section>
      </div>
    </main>
  );
}
