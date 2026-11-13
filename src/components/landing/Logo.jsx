import { Droplets } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 ${
        light ? "text-white" : "text-[#08172B]"
      }`}
    >
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${
          light
            ? "bg-white/10 text-[#63D6D2]"
            : "bg-[#E5F6F5] text-[#087E85]"
        }`}
      >
        <Droplets size={23} />
      </span>

      <span className="text-lg font-extrabold tracking-tight">
        Amrit Jal
      </span>
    </Link>
  );
}