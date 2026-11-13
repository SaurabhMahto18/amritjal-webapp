
import { Link } from "react-router-dom";

function ToolIcon({ type }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "water":
      return (
        <svg {...common}>
          <path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z" />
          <path d="M9 15a3 3 0 0 0 3 3" />
        </svg>
      );

    case "flask":
      return (
        <svg {...common}>
          <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
          <path d="M8 15h8" />
        </svg>
      );

    case "truck":
      return (
        <svg {...common}>
          <path d="M3 6h11v11H3z" />
          <path d="M14 10h4l3 3v4h-7z" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="17.5" cy="18" r="1.5" />
        </svg>
      );

    case "ph":
      return (
        <svg {...common}>
          <path d="M4 19h16M6 16V9M10 16V5M14 16v-4M18 16V7" />
        </svg>
      );

    default:
      return null;
  }
}

export default function ToolCard({ tool }) {
  return (
    <Link
      to={`/tools/${tool.id}`}
      className="group flex min-h-[180px] flex-col rounded-2xl border border-[#E0E7EC] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#63D6D2] hover:shadow-[0_12px_30px_rgba(16,31,53,0.07)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#63D6D2]/25"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-xl border border-[#E3E8EA] bg-[#F5F4EF] text-[#087E85]">
          <ToolIcon type={tool.icon} />
        </span>

        <span className="text-[10px] font-semibold tracking-[0.15em] text-[#64748B]">
          {tool.number}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-bold leading-5 text-[#101F35] transition-colors group-hover:text-[#087E85]">
        {tool.title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#64748B]">
        {tool.description}
      </p>

      <span className="mt-auto pt-4 text-xs font-bold text-[#087E85]">
        Open calculator →
      </span>
    </Link>
  );
}
