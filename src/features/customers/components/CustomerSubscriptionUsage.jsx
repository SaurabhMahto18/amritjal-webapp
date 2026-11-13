
export default function CustomerSubscriptionUsage({
    usage,
    loading,
    error,
    onRetry,
}) {
    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border border-stone-200 bg-white p-5">
                <div className="h-4 w-36 rounded bg-stone-200" />
                <div className="mt-4 h-8 w-24 rounded bg-stone-200" />
                <div className="mt-4 h-2 rounded-full bg-stone-100" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                    Subscription details could not be loaded.
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!usage?.exists) {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
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
    const unlimited = usage.unlimited && usage.accessValid;
    const accessValid = usage.accessValid;

    const percentage =
        !unlimited && limit > 0
            ? Math.min((activeCount / limit) * 100, 100)
            : 0;

    const limitReached =
        !unlimited &&
        limit !== null &&
        activeCount >= limit;

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                        Customer subscription usage
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {usage.planName}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${accessValid
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                        >
                            {accessValid ? "Access active" : "Access inactive"}
                        </span>

                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium capitalize text-stone-600">
                            {usage.status}
                        </span>

                        {usage.isComplimentary && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Complimentary
                            </span>
                        )}
                    </div>
                </div>

                <div className="sm:text-right">
                    <p className="text-3xl font-bold tabular-nums text-slate-900">
                        {activeCount}
                        <span className="text-lg font-medium text-stone-400">
                            {unlimited ? " / ∞" : limit !== null ? ` / ${limit}` : " / —"}
                        </span>
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                        Active customers
                    </p>
                </div>
            </div>

            {!unlimited && limit !== null && (
                <>
                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-100">
                        <div
                            className={`h-full rounded-full transition-all ${limitReached ? "bg-red-500" : "bg-emerald-500"
                                }`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-stone-500">
                            {percentage.toFixed(0)}% used
                        </span>

                        <span
                            className={`font-semibold ${limitReached ? "text-red-600" : "text-emerald-700"
                                }`}
                        >
                            {Math.max(limit - activeCount, 0)} slots remaining
                        </span>
                    </div>
                </>
            )}

            {unlimited && (
                <p className="mt-4 text-sm font-medium text-emerald-700">
                    Full Access Override is active. Customer limit is bypassed.
                </p>
            )}

            {!unlimited && limit === null && (
                <p className="mt-4 text-sm text-amber-700">
                    No customer limit is configured. Please contact support.
                </p>
            )}

            {limitReached && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-800">
                        Customer limit reached
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-700">
                        Upgrade your plan or contact support to add more active customers.
                    </p>
                </div>
            )}

            {!accessValid && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-800">
                        Subscription access is inactive
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-700">
                        New customer creation and restoration may be blocked. Please renew your subscription or contact support.
                    </p>
                </div>
            )}
        </section>
    );
}
