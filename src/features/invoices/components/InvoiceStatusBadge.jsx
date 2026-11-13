
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CircleDollarSign,
} from "lucide-react";

const STATUS_CONFIG = {
  Paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 ring-green-600/20",
    Icon: CheckCircle2,
  },
  Unpaid: {
    label: "Unpaid",
    className: "bg-red-100 text-red-800 ring-red-600/20",
    Icon: CircleDollarSign,
  },
  Partial: {
    label: "Partially Paid",
    className: "bg-amber-100 text-amber-800 ring-amber-600/20",
    Icon: Clock,
  },
  Overdue: {
    label: "Overdue",
    className: "bg-orange-100 text-orange-800 ring-orange-600/20",
    Icon: AlertCircle,
  },
};

export default function InvoiceStatusBadge({
  status = "Unpaid",
  showIcon = true,
  size = "md",
  className = "",
}) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    className: "bg-gray-100 text-gray-700 ring-gray-500/20",
    Icon: CircleDollarSign,
  };

  const { label, Icon } = config;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const badgeSize = sizeClasses[size] || sizeClasses.md;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        config.className,
        badgeSize,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showIcon && <Icon size={14} aria-hidden="true" />}
      {label}
    </span>
  );
}
