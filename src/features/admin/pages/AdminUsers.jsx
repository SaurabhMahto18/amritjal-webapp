
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Search,
  RefreshCw,
  MoreHorizontal,
  Mail,
  CheckCircle2,
  XCircle,
  Clock3,
  ChevronDown,
  X,
  LockKeyhole,
  Wallet,
  Headset,
  Settings2,
  AlertCircle,
} from "lucide-react";

import {
  getAdminUsers,
  invitePlatformAdmin,
  updatePlatformAdminRole,
  updatePlatformAdminStatus,
} from "../services/adminUserService";

const ROLES = {
  super_admin: {
    label: "Super Admin",
    description: "Complete platform access",
    icon: ShieldCheck,
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  finance_admin: {
    label: "Finance Admin",
    description: "Revenue and payment management",
    icon: Wallet,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  support_admin: {
    label: "Support Admin",
    description: "Business and support management",
    icon: Headset,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  operations_admin: {
    label: "Operations Admin",
    description: "Subscriptions and renewals",
    icon: Settings2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const ROLE_OPTIONS = Object.entries(ROLES).map(([value, role]) => ({
  value,
  label: role.label,
}));

const PERMISSION_LABELS = {
  "dashboard.view": "View dashboard",
  "businesses.view": "View businesses",
  "businesses.manage": "Manage businesses",
  "subscriptions.view": "View subscriptions",
  "subscriptions.manage": "Manage subscriptions",
  "plans.view": "View plans",
  "plans.manage": "Manage plans",
  "revenue.view": "View revenue",
  "payments.manage": "Manage payments",
  "renewals.view": "View renewals",
  "renewals.manage": "Manage renewals",
  "support.view": "View support tickets",
  "support.manage": "Manage support tickets",
  "activity_logs.view": "View activity logs",
  "admin_users.view": "View platform admins",
  "admin_users.manage": "Manage platform admins",
  "settings.manage": "Manage settings",
};

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(email = "") {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";
}

function RoleBadge({ role }) {
  const config = ROLES[role] || ROLES.operations_admin;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.color}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function Modal({ title, description, onClose, children, size = "max-w-lg" }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${size} overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#24262B]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-2.5 ${iconClass}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-[#24262B]">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("admins");

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("support_admin");

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);

  const loadAdmins = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await getAdminUsers();
      setAdmins(result.admins || []);
      setPermissions(result.permissions || []);
      setCurrentUserId(result.currentUserId || null);
    } catch (err) {
      setError(err.message || "Unable to load platform admins.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.email?.toLowerCase().includes(search.toLowerCase()) ||
        admin.user_id?.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" || admin.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && admin.is_active) ||
        (statusFilter === "inactive" && !admin.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, search, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: admins.length,
    active: admins.filter((admin) => admin.is_active).length,
    inactive: admins.filter((admin) => !admin.is_active).length,
    superAdmins: admins.filter(
      (admin) => admin.role === "super_admin" && admin.is_active
    ).length,
  }), [admins]);

  async function handleInvite(event) {
    event.preventDefault();

    if (!inviteEmail.trim()) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await invitePlatformAdmin({
        email: inviteEmail,
        role: inviteRole,
      });

      setNotice(result.message || "Invitation sent successfully.");
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("support_admin");
      await loadAdmins(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(admin, role) {
    if (admin.role === role) return;

    if (
      admin.role === "super_admin" &&
      role !== "super_admin" &&
      !window.confirm(
        "Are you sure you want to downgrade this Super Admin?"
      )
    ) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await updatePlatformAdminRole({
        userId: admin.user_id,
        role,
      });

      setNotice(result.message || "Role updated successfully.");
      setSelectedAdmin(null);
      await loadAdmins(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(admin) {
    const nextStatus = !admin.is_active;

    const message = nextStatus
      ? `Activate ${admin.email}?`
      : `Deactivate ${admin.email}? They will lose platform admin access.`;

    if (!window.confirm(message)) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await updatePlatformAdminStatus({
        userId: admin.user_id,
        isActive: nextStatus,
      });

      setNotice(result.message || "Admin status updated.");
      setMenuUserId(null);
      await loadAdmins(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const groupedPermissions = useMemo(() => {
    const groups = {};

    permissions.forEach((item) => {
      if (!groups[item.role]) groups[item.role] = [];
      groups[item.role].push(item.permission);
    });

    return groups;
  }, [permissions]);

  return (
    <div className="min-h-screen space-y-6 bg-[#F7F6F0] p-4 sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A8A48]">
            <Shield size={14} />
            Platform administration
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#24262B] sm:text-3xl">
            Admin Users & Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage platform administrators, roles and access permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAdmins(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E1D6] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E9CA43] px-4 py-2.5 text-sm font-bold text-[#24262B] shadow-sm transition hover:bg-[#dfbd2f]"
          >
            <UserPlus size={17} />
            Invite Admin
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {notice}
          <button onClick={() => setNotice("")} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Administrators"
          value={stats.total}
          subtitle="Registered platform admins"
          icon={Users}
          iconClass="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Active Admins"
          value={stats.active}
          subtitle="Currently enabled accounts"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Inactive Admins"
          value={stats.inactive}
          subtitle="Access currently disabled"
          icon={XCircle}
          iconClass="bg-red-50 text-red-600"
        />
        <StatCard
          title="Super Admins"
          value={stats.superAdmins}
          subtitle="Active full-access accounts"
          icon={ShieldCheck}
          iconClass="bg-violet-50 text-violet-700"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E6E2D8]">
        <button
          onClick={() => setActiveTab("admins")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "admins"
              ? "border-[#D7B52E] text-[#24262B]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Users size={16} /> Admin users
          </span>
        </button>

        <button
          onClick={() => setActiveTab("permissions")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "permissions"
              ? "border-[#D7B52E] text-[#24262B]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <LockKeyhole size={16} /> Permission matrix
          </span>
        </button>
      </div>

      {/* Admin listing */}
      {activeTab === "admins" && (
        <section className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-[#24262B]">Platform administrators</h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredAdmins.length} administrators found
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="relative sm:col-span-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search email or ID..."
                  className="w-full rounded-xl border border-stone-200 bg-[#FCFCFA] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#D9BB3C] focus:ring-2 focus:ring-[#E9CA43]/20"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-stone-200 bg-[#FCFCFA] px-3 py-2.5 text-sm outline-none focus:border-[#D9BB3C]"
              >
                <option value="all">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-stone-200 bg-[#FCFCFA] px-3 py-2.5 text-sm outline-none focus:border-[#D9BB3C]"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-stone-100"
                />
              ))}
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="rounded-2xl bg-stone-100 p-4 text-slate-400">
                <Users size={28} />
              </div>
              <h3 className="mt-4 font-semibold text-[#24262B]">
                No administrators found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#FAF9F5] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Administrator</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Added on</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.user_id} className="transition hover:bg-[#FDFCF8]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7EFC9] text-sm font-bold text-[#806B19]">
                            {getInitials(admin.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#24262B]">
                              {admin.email}
                            </p>
                            <p className="mt-0.5 max-w-[230px] truncate font-mono text-[10px] text-slate-400">
                              {admin.user_id}
                            </p>
                            {admin.user_id === currentUserId && (
                              <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-[#A18720]">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={admin.role} />
                      </td>

                      <td className="px-5 py-4">
                        {admin.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(admin.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAdmin(admin)}
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-50"
                          >
                            Manage
                          </button>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setMenuUserId(
                                  menuUserId === admin.user_id
                                    ? null
                                    : admin.user_id
                                )
                              }
                              className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50"
                              aria-label="More actions"
                            >
                              <MoreHorizontal size={17} />
                            </button>

                            {menuUserId === admin.user_id && (
                              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl">
                                <button
                                  disabled={admin.user_id === currentUserId}
                                  onClick={() => handleStatusChange(admin)}
                                  className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {admin.is_active
                                    ? "Deactivate admin"
                                    : "Activate admin"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col justify-between gap-2 border-t border-stone-100 bg-[#FCFCFA] px-5 py-3 text-xs text-slate-400 sm:flex-row">
            <span>Showing {filteredAdmins.length} of {admins.length} admins</span>
            <span>Access is controlled by platform roles and permissions.</span>
          </div>
        </section>
      )}

      {/* Permission matrix */}
      {activeTab === "permissions" && (
        <section className="overflow-hidden rounded-2xl border border-[#EDEAE0] bg-white shadow-sm">
          <div className="border-b border-stone-100 p-5">
            <h2 className="font-bold text-[#24262B]">Role permission matrix</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the permissions assigned to each platform role.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#FAF9F5]">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Permission
                  </th>
                  {Object.entries(ROLES).map(([role, config]) => (
                    <th key={role} className="px-4 py-4 text-center">
                      <span className="text-xs font-bold text-[#24262B]">
                        {config.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {Object.entries(PERMISSION_LABELS).map(([permission, label]) => (
                  <tr key={permission} className="hover:bg-[#FDFCF8]">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#24262B]">{label}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                        {permission}
                      </p>
                    </td>

                    {Object.keys(ROLES).map((role) => {
                      const granted =
                        role === "super_admin" ||
                        (groupedPermissions[role] || []).includes(permission);

                      return (
                        <td key={role} className="px-4 py-3 text-center">
                          {granted ? (
                            <CheckCircle2
                              size={19}
                              className="mx-auto text-emerald-600"
                            />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-stone-100 bg-[#FCFCFA] px-5 py-3 text-xs text-slate-500">
            This matrix is currently read-only. Permission changes are managed through the database.
          </div>
        </section>
      )}

      {/* Invite modal */}
      {showInvite && (
        <Modal
          title="Invite platform administrator"
          description="An invitation email will be sent to the new administrator."
          onClose={() => setShowInvite(false)}
        >
          <form onSubmit={handleInvite} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#D9BB3C] focus:ring-2 focus:ring-[#E9CA43]/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Assign role
              </label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D9BB3C]"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">
                {ROLES[inviteRole].description}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              The invited user must accept the email invitation before signing in.
              Their platform access is controlled by the selected role.
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E9CA43] px-5 py-2.5 text-sm font-bold text-[#24262B] hover:bg-[#dfbd2f] disabled:opacity-50"
              >
                <Mail size={16} />
                {saving ? "Sending..." : "Send invitation"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage admin modal */}
      {selectedAdmin && (
        <Modal
          title="Manage administrator"
          description="Review and update this administrator's access."
          onClose={() => setSelectedAdmin(null)}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-[#FAF9F5] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F7EFC9] font-bold text-[#806B19]">
                {getInitials(selectedAdmin.email)}
              </div>
              <div className="min-w-0">
                <p className="break-all text-sm font-bold text-[#24262B]">
                  {selectedAdmin.email}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Added {formatDate(selectedAdmin.created_at)}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Platform role
              </label>
              <select
                value={selectedAdmin.role}
                disabled={
                  saving ||
                  selectedAdmin.user_id === currentUserId
                }
                onChange={(event) =>
                  handleRoleChange(selectedAdmin, event.target.value)
                }
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#D9BB3C] disabled:bg-stone-100"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {selectedAdmin.user_id === currentUserId && (
                <p className="mt-2 text-xs text-slate-400">
                  You cannot change your own Super Admin role here.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
              <div>
                <p className="text-sm font-semibold text-[#24262B]">
                  Account status
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedAdmin.is_active
                    ? "This admin currently has access."
                    : "This admin currently has no platform access."}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  selectedAdmin.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {selectedAdmin.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex justify-end border-t border-stone-100 pt-4">
              <button
                onClick={() => setSelectedAdmin(null)}
                className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
