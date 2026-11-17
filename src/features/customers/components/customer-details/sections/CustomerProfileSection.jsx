
import { memo } from "react";
import { UserRound, ShieldCheck } from "lucide-react";
import CustomerForm from "../CustomerForm";

function CustomerProfileSection({
  customer,
  onSubmit,
  onCancel,
  submitting = false,
  isArchived = false,
}) {
  if (!customer) {
    return (
      <div className="mx-auto w-full rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-8">
        <UserRound
          size={30}
          className="mx-auto text-slate-400"
          aria-hidden="true"
        />

        <p className="mt-3 text-sm font-medium text-slate-600">
          Customer information is unavailable.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="customer-profile-title"
      className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Header */}
      <header className="flex min-w-0 flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 lg:px-7">
        <div className="min-w-0">
          <h2
            id="customer-profile-title"
            className="text-base font-bold text-[#102C46] sm:text-lg"
          >
            Customer Profile
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Update customer basic details.
          </p>
        </div>

        <span className="inline-flex max-w-full items-center self-start rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 sm:self-center">
          <UserRound
            size={14}
            className="mr-1.5 shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">
            {customer.name || "Customer"}
          </span>
        </span>
      </header>

      {/* Form Content */}
      <div className="w-full min-w-0 p-3 sm:p-5 lg:p-7">
        {isArchived ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4"
          >
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
              aria-hidden="true"
            />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Archived Customer
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
                This customer is archived. Profile editing is disabled.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0 [&_input]:max-w-full [&_select]:max-w-full [&_textarea]:max-w-full">
            <CustomerForm
              key={customer.id}
              initialData={customer}
              onSubmit={onSubmit}
              onCancel={onCancel}
              submitting={submitting}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(CustomerProfileSection);
