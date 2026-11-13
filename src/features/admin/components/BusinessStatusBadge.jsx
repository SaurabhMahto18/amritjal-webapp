
export default function BusinessStatusBadge({ suspended }) {
  return suspended ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Suspended
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}
