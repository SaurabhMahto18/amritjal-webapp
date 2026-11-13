export default function CustomerPagination({
  page,
  totalPages,
  totalCustomers,
  onPageChange,
}) {
  if (!totalCustomers || totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, page + 1);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push("...");

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) pages.push("...");
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  const buttonClass =
    "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex w-full items-center justify-between gap-2 overflow-x-auto border-t border-gray-100 px-3 py-3">
      <p className="shrink-0 whitespace-nowrap text-xs text-gray-500">
        Page {page} of {totalPages}
      </p>

      <div className="flex shrink-0 flex-nowrap items-center gap-1">
        <button
          type="button"
          className={buttonClass}
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
        >
          «
        </button>

        <button
          type="button"
          className={buttonClass}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>

        {getPages().map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="shrink-0 px-1 text-sm text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              type="button"
              key={item}
              onClick={() => onPageChange(item)}
              aria-current={page === item ? "page" : undefined}
              className={`${buttonClass} ${page === item
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className={buttonClass}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>

        <button
          type="button"
          className={buttonClass}
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}