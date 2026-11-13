import WalletTransactionItem from "./WalletTransactionItem";

export default function WalletTransactionList({ transactions, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
        Loading wallet transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
        No wallet transactions found.
      </div>
    );
  }

  const groups = transactions.reduce((result, item) => {
    const date = item.date
      ? new Date(item.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Date unavailable";

    if (!result[date]) result[date] = [];
    result[date].push(item);
    return result;
  }, {});

  return (
    <div className="max-h-[680px] space-y-5 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {Object.entries(groups).map(([date, items]) => (
        <section key={date}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {date}
          </h3>
          <div className="space-y-3">
            {items.map((item) => (
              <WalletTransactionItem key={item.id} transaction={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
