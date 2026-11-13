import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function WalletTransactionItem({ transaction }) {
  const incoming = transaction.type === "in";

  const date = transaction.date
    ? new Date(transaction.date)
    : null;

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
        incoming ? "bg-slate-100 text-teal-600" : "bg-red-50 text-red-600"
      }`}>
        {incoming
          ? <ArrowDownLeft size={25} />
          : <ArrowUpRight size={25} />}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">
          {transaction.title}
        </h3>
        <p className="mt-1 break-words text-sm text-slate-500">
          {transaction.description || "Wallet transaction"}
        </p>
        {date && (
          <p className="mt-1 text-xs text-slate-400">
            {date.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className={`shrink-0 text-right text-sm font-bold sm:text-base ${
        incoming ? "text-teal-600" : "text-red-600"
      }`}>
        {incoming ? "+" : transaction.type === "out" ? "−" : ""}
        {" "}₹ {transaction.amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    </article>
  );
}
