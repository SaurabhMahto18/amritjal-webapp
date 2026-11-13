// TODO: Delivery groups/routes and customer assignments.

import { MapPinned, Construction } from "lucide-react";

export default function RoutesPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <MapPinned size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Route Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage delivery routes and customer assignments.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            <Construction size={19} />
            Complete route management module is pending development.
          </div>
        </div>
      </div>
    </main>
  );
}
