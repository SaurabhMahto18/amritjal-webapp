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

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(n || 0));

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
    (a, e) => ({
      count: a.count + 1,
      invoice: a.invoice + e.eventInvoice,
      due: a.due + e.dueAmount,
      advance: a.advance + e.advanceAmount,
      payment: a.payment + e.eventPayment,
      delivered: a.delivered + e.delivered,
      received: a.received + e.received,
      unreceived: a.unreceived + e.unreceived,
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">
        Event Summary
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(
          ({ key, label, icon: Icon, tone, money: isMoney }) => (
            <article
              key={key}
              className="flex min-h-[78px] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
              >
                <Icon size={20} />
              </span>

              <div className="min-w-0">
                <p className="text-sm text-slate-500">{label}</p>

                <p className="mt-0.5 truncate text-xl font-bold leading-tight text-slate-950">
                  {isMoney
                    ? money(total[key])
                    : total[key].toLocaleString("en-IN")}
                </p>
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
}