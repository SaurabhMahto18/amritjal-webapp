import { Users } from "lucide-react";

import CustomerListItem from "./CustomerListItem";
import CustomerPagination from "./CustomerPagination";

export default function CustomerList({
  customers = [],
  selectedCustomerId,
  onSelect,
  page = 1,
  totalPages = 1,
  totalCustomers = 0,
  onPageChange,
  loading = false,
}) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-500" />

          <h2 className="font-semibold text-slate-900">
            Customers
          </h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {totalCustomers} customers
        </span>
      </div>

      {/* CUSTOMER LIST */}
      <div className="max-h-[620px] min-h-[200px] flex-1 space-y-1 overflow-y-auto p-2">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Users
              size={28}
              className="mx-auto mb-2 text-slate-300"
            />

            <p className="text-sm font-medium text-slate-600">
              No customers found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          customers.map((customer) => (
            <CustomerListItem
              key={customer.id}
              customer={customer}
              selected={
                String(selectedCustomerId) === String(customer.id)
              }
              onClick={() => onSelect(customer)}
            />
          ))
        )}
      </div>

      {/* PAGINATION */}
      {!loading && (
        <div className="shrink-0">
          <CustomerPagination
            page={page}
            totalPages={totalPages}
            totalCustomers={totalCustomers}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  );
}