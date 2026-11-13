
function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#24262B]">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default function BusinessOverview({ business }) {
  if (!business) return null;

  const address = [
    business.address,
    business.village,
    business.district,
    business.state,
    business.postal_code,
    business.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="rounded-2xl border border-[#EDEAE0] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={`${business.name} logo`}
              className="h-16 w-16 rounded-xl border border-gray-100 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F7F6F0] text-2xl font-bold text-[#24262B]">
              {business.name?.charAt(0)?.toUpperCase() || "B"}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-[#24262B]">
              {business.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {business.legal_name || "Legal name not provided"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            business.status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {business.status || "Unknown"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Business Phone" value={business.phone} />
        <Detail label="Email Address" value={business.email} />
        <Detail label="Business Address" value={address} />
        <Detail label="GST Number" value={business.gst_number} />
        <Detail label="PAN Number" value={business.pan_number} />
        <Detail
          label="Registration Number"
          value={business.registration_number}
        />
        <Detail label="Invoice Prefix" value={business.invoice_prefix} />
        <Detail label="Currency" value={business.currency_code} />
        <Detail label="Timezone" value={business.timezone} />
        <Detail
          label="Default Due Days"
          value={
            business.default_due_days != null
              ? `${business.default_due_days} days`
              : null
          }
        />
        <Detail
          label="Registered On"
          value={
            business.created_at
              ? new Date(business.created_at).toLocaleDateString("en-IN")
              : null
          }
        />
        <Detail
          label="Last Updated"
          value={
            business.updated_at
              ? new Date(business.updated_at).toLocaleDateString("en-IN")
              : null
          }
        />
      </div>
    </section>
  );
}
