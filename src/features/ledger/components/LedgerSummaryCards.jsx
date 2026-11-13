
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const DEFAULT_CURRENCY = "INR";

function formatMoney(value, currency = DEFAULT_CURRENCY) {
  const amount = Number(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function SummaryCard({
  title,
  amount,
  description,
  icon: Icon,
  tone = "blue",
  currency = DEFAULT_CURRENCY,
}) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-700",
      accent: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700",
    },
    cyan: {
      icon: "bg-cyan-50 text-cyan-700",
      accent: "bg-cyan-500",
      badge: "bg-cyan-50 text-cyan-700",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      accent: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700",
    },
    rose: {
      icon: "bg-rose-50 text-rose-700",
      accent: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700",
    },
  };

  const selectedStyle = styles[tone] || styles.blue;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div
        className={`absolute inset-x-0 top-0 h-1 ${selectedStyle.accent}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {formatMoney(amount, currency)}
          </p>

          {description && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${selectedStyle.icon}`}
        >
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}

/**
 * LedgerSummaryCards
 *
 * Props:
 * - openingBalance: opening balance for the ledger
 * - totalDebit: total debit transactions
 * - totalCredit: total credit transactions
 * - closingBalance: calculated closing balance
 * - currency: currency code, defaults to INR
 *
 * Important:
 * Pass values calculated by your ledger service.
 * This component displays figures; it does not create ledger
 * transactions or calculate a real customer balance.
 */
export default function LedgerSummaryCards({
  openingBalance = 0,
  totalDebit = 0,
  totalCredit = 0,
  closingBalance,
  currency = DEFAULT_CURRENCY,
}) {
  const opening = Number(openingBalance) || 0;
  const debit = Number(totalDebit) || 0;
  const credit = Number(totalCredit) || 0;

  // Only calculate a fallback if the caller has not supplied
  // a closing balance. The sign convention must match your ledger.
  const closing =
    closingBalance !== undefined && closingBalance !== null
      ? Number(closingBalance) || 0
      : opening + debit - credit;

  const cards = [
    {
      key: "opening",
      title: "Opening Balance",
      amount: opening,
      description: "Balance carried forward",
      icon: Wallet,
      tone: "blue",
    },
    {
      key: "debit",
      title: "Total Debit",
      amount: debit,
      description: "Total debit transactions",
      icon: TrendingDown,
      tone: "rose",
    },
    {
      key: "credit",
      title: "Total Credit",
      amount: credit,
      description: "Total credit transactions",
      icon: TrendingUp,
      tone: "emerald",
    },
    {
      key: "closing",
      title: "Closing Balance",
      amount: closing,
      description: "Balance as per supplied ledger figures",
      icon: Scale,
      tone: "cyan",
    },
  ];

  return (
    <section
      aria-label="Ledger summary"
      className="space-y-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Ledger Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Overview of opening balance, debits, credits and closing balance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SummaryCard
            key={card.key}
            title={card.title}
            amount={card.amount}
            description={card.description}
            icon={card.icon}
            tone={card.tone}
            currency={currency}
          />
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
          <Scale size={18} />
        </div>

        <div>
          <p className="text-sm font-semibold text-blue-900">
            Balance calculation
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            The fallback closing balance uses Opening Balance + Total Debit −
            Total Credit. Confirm that this matches your ledger's debit and
            credit convention before using the result for accounting.
          </p>
        </div>
      </div>
    </section>
  );
}
