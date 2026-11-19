import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Wallet,
  Plus,
  Package,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const cards = [
  {
    key: "count",
    label: "Total Event",
    icon: CalendarDays,
    tone: "blue",
  },
  {
    key: "invoice",
    label: "Event Invoice",
    icon: CircleDollarSign,
    tone: "green",
    money: true,
  },
  {
    key: "due",
    label: "Due amount",
    icon: Clock3,
    tone: "red",
    money: true,
  },
  {
    key: "advance",
    label: "Advance amount",
    icon: Wallet,
    tone: "teal",
    money: true,
  },
  {
    key: "payment",
    label: "Event Payment",
    icon: Plus,
    tone: "green",
    money: true,
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: Package,
    tone: "yellow",
  },
  {
    key: "received",
    label: "Received",
    icon: CircleCheck,
    tone: "green",
  },
  {
    key: "unreceived",
    label: "Unreceived",
    icon: TriangleAlert,
    tone: "orange",
  },
];

const tones = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-500",
  teal: "bg-teal-100 text-teal-600",
  yellow: "bg-yellow-100 text-yellow-600",
  orange: "bg-orange-100 text-orange-600",
};

export default function EventSummary({ events = [] }) {
  const total = events.reduce(
    (acc, event) => ({
      count: acc.count + 1,
      invoice: acc.invoice + (Number(event.eventInvoice) || 0),
      due: acc.due + (Number(event.dueAmount) || 0),
      advance: acc.advance + (Number(event.advanceAmount) || 0),
      payment: acc.payment + (Number(event.eventPayment) || 0),
      delivered: acc.delivered + (Number(event.delivered) || 0),
      received: acc.received + (Number(event.received) || 0),
      unreceived: acc.unreceived + (Number(event.unreceived) || 0),
    }),
    {
      count: 0,
      invoice: 0,
      due: 0,
      advance: 0,
      payment: 0,
      delivered: 0,
      received: 0,
      unreceived: 0,
    }
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
      <h2 className="mb-2.5 text-sm font-semibold text-slate-900 sm:mb-4 sm:text-base">
        Event Summary
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5">
        {cards.map(({ key, label, icon: Icon, tone, money: isMoney }) => (
          <article
            key={key}
            className="flex min-h-[62px] min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2 sm:min-h-[78px] sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-11 sm:rounded-xl ${tones[tone]}`}
            >
              <Icon size={16} className="sm:hidden" />
              <Icon size={20} className="hidden sm:block" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-[11px] leading-4 text-slate-500 sm:text-sm">
                {label}
              </p>
              <p className="mt-0.5 truncate text-base font-bold leading-tight text-slate-950 sm:text-xl">
                {isMoney
                  ? money(total[key])
                  : total[key].toLocaleString("en-IN")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
