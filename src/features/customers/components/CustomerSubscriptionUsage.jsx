
export default function CustomerSubscriptionUsage({
    usage,
    loading,
    error,
    onRetry,
}) {
    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-4">
                <div className="h-3 w-36 rounded bg-stone-200" />
                <div className="mt-3 h-5 w-28 rounded bg-stone-200" />
                <div className="mt-4 h-2 rounded-full bg-stone-100" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                    Subscription details could not be loaded.
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!usage?.exists) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="font-bold text-amber-900">
                    Subscription not found
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                    Please contact support to configure your business subscription.
                </p>
            </div>
        );
    }

    const activeCount = Number(usage.activeCount || 0);
    const limit = usage.limit;
    const unlimited = Boolean(usage.unlimited && usage.accessValid);
    const accessValid = usage.accessValid;

    const percentage =
        !unlimited && limit > 0
            ? Math.min((activeCount / limit) * 100, 100)
            : 0;

    const limitReached =
        !unlimited && limit !== null && activeCount >= limit;

    // Visual activity indicator only; it does not represent a limit.
    const activityWidth = unlimited
        ? Math.min((activeCount / (activeCount + 20)) * 100, 95)
        : percentage;

    return (
        <section className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Customer Subscription Usage
            </p>

            <div className="mt-1 flex items-center justify-between gap-2">
                <h3 className="min-w-0 truncate text-base font-bold text-slate-900">
                    {usage.planName}
                </h3>

                <p className="shrink-0 text-xl font-bold tabular-nums text-slate-900">
                    {activeCount}
                    <span className="text-sm font-medium text-stone-400">
                        {unlimited
                            ? " / ∞"
                            : limit !== null
                                ? ` / ${limit}`
                                : " / —"}
                    </span>
                </p>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        accessValid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                    }`}
                >
                    {accessValid ? "Access active" : "Access inactive"}
                </span>

                <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-medium capitalize text-stone-600">
                    {usage.status}
                </span>

                {usage.isComplimentary && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                        Complimentary
                    </span>
                )}
            </div>

            <div className="mt-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-stone-600">
                        Customer activity
                    </span>

                    <span className="text-[11px] font-semibold text-teal-700">
                        {activeCount} active
                    </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            !accessValid
                                ? "bg-red-500"
                                : limitReached
                                    ? "bg-red-500"
                                    : "bg-teal-600"
                        }`}
                        style={{
                            width: `${activityWidth}%`,
                            minWidth: activeCount > 0 ? "5px" : "0px",
                        }}
                    />
                </div>
            </div>

            {unlimited && usage.isComplimentary && (
                <p className="mt-2 text-[11px] font-medium text-teal-700">
                    Complimentary personal account · Unlimited customers
                </p>
            )}

            {unlimited && !usage.isComplimentary && (
                <p className="mt-2 text-[11px] font-medium text-teal-700">
                    Unlimited customer access is active.
                </p>
            )}

            {!unlimited && limit !== null && (
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-stone-500">
                        {percentage.toFixed(0)}% used
                    </span>
                    <span className={`font-semibold ${
                        limitReached ? "text-red-600" : "text-emerald-700"
                    }`}>
                        {Math.max(limit - activeCount, 0)} slots remaining
                    </span>
                </div>
            )}

            {!unlimited && limit === null && (
                <p className="mt-2 text-[11px] text-amber-700">
                    No customer limit is configured. Please contact support.
                </p>
            )}

            {limitReached && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-800">
                        Customer limit reached
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                        Upgrade your plan or contact support to add more active customers.
                    </p>
                </div>
            )}

            {!accessValid && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-800">
                        Subscription access is inactive
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                        New customer creation and restoration may be blocked.
                        Please renew your subscription or contact support.
                    </p>
                </div>
            )}
        </section>
    );
}
