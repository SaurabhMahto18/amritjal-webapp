
import { UserRound, ShieldCheck } from "lucide-react";
import CustomerForm from "../CustomerForm";

export default function CustomerProfileSection({
  customer,
  onSubmit,
  onCancel,
  submitting = false,
  isArchived = false,
}) {
  if (!customer) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
        <UserRound
          size={28}
          className="mx-auto text-slate-400"
        />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Customer information is unavailable.
        </p>
      </div>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Section Header */}
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <h2 className="text-lg font-bold text-[#102C46]">
            Customer Profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update customer basic details.
          </p>
        </div>

        <span className="inline-flex max-w-full items-center self-start rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 sm:self-center">
          <span className="truncate">
            {customer.name || "Customer"}
          </span>
        </span>
      </header>

      {/* Profile Form */}
      <div className="p-4 sm:p-6 lg:p-7">
        {isArchived ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <p className="text-sm leading-6 text-amber-800">
              This customer is archived. Profile editing is disabled.
            </p>
          </div>
        ) : (
          <CustomerForm
            key={customer.id}
            initialData={customer}
            onSubmit={onSubmit}
            onCancel={onCancel}
            submitting={submitting}
          />
        )}
      </div>
    </section>
  );
}
