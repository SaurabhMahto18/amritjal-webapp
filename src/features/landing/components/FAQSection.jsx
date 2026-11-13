
import { useState } from "react";
import {
  Plus,
  Minus,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { faqs } from "../data/faqs";

export default function FAQSection() {
  const [active, setActive] = useState(0);

  // Replace with your actual WhatsApp business number.
  const whatsappNumber = "91XXXXXXXXXX";

  return (
    <section
      id="faqs"
      aria-labelledby="faq-heading"
      className="relative isolate overflow-hidden bg-[#F0F5F3] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* LIGHT GRID BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(#D8E5DF 1px, transparent 1px),
            linear-gradient(90deg, #D8E5DF 1px, transparent 1px)
          `,
          backgroundSize: "42px 42px",
        }}
      />

      {/* SOFT BACKGROUND GLOWS */}
      <div className="pointer-events-none absolute -left-40 top-10 -z-10 size-[400px] rounded-full bg-[#BCE9DE]/35 blur-[110px]" />

      <div className="pointer-events-none absolute -right-40 bottom-0 -z-10 size-[400px] rounded-full bg-[#F2DDAE]/25 blur-[110px]" />

      <div className="mx-auto grid max-w-[1440px] items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 xl:gap-24">

        {/* LEFT: STICKY INTRODUCTION */}
        <div className="lg:sticky lg:top-24 lg:self-start">

          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE7E0] bg-white px-3.5 py-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-[#087E85]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E85]">
              Still thinking?
            </span>
          </div>

          <h2
            id="faq-heading"
            className="mt-6 text-balance text-[38px] font-black leading-[1.08] tracking-[-0.045em] text-[#101F35] sm:text-[48px] lg:text-[52px] xl:text-[60px]"
          >
            Asked &{" "}
            <span className="italic text-[#087E85]">
              answered.
            </span>
          </h2>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#647487] sm:text-base sm:leading-8">
            Have questions about managing your water delivery business
            with Amrit Jal? Find answers to common questions below.
            Need more help? Our team is ready to assist.
          </p>

          {/* WHATSAPP CTA */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              "Hello Amrit Jal, I have a question about your water business management app."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#20C969] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(32,201,105,0.16)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#18B85D] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#20C969]/25"
          >
            <MessageCircle size={19} />
            Chat with our team
            <ArrowUpRight size={15} />
          </a>

          <p className="mt-4 text-[11px] text-[#89969A]">
            We're happy to help you get started.
          </p>
        </div>

        {/* RIGHT: INDEPENDENT SCROLLABLE FAQ LIST */}
        <div
          className="
            min-w-0
            lg:max-h-[calc(100vh-120px)]
            lg:overflow-y-auto
            lg:overscroll-contain
            lg:pr-3
            lg:[scrollbar-width:thin]
            lg:[scrollbar-color:#CBD8D1_transparent]
            lg:[&::-webkit-scrollbar]:w-1.5
            lg:[&::-webkit-scrollbar-thumb]:rounded-full
            lg:[&::-webkit-scrollbar-thumb]:bg-[#CBD8D1]
            lg:[&::-webkit-scrollbar-track]:bg-transparent
          "
        >
          <div className="space-y-3 pb-1 sm:space-y-4">

            {faqs.map((faq, index) => {
              const expanded = active === index;
              const answerId = `faq-answer-${index}`;

              return (
                <article
                  key={faq.question}
                  className={`
                    overflow-hidden rounded-[18px]
                    border bg-white
                    transition-all duration-300
                    ${
                      expanded
                        ? "border-[#B9DDD7] shadow-[0_8px_25px_rgba(8,126,133,0.07)]"
                        : "border-[#E1E8EE] shadow-[0_2px_8px_rgba(16,31,53,0.025)] hover:border-[#C7DCD5] hover:shadow-md"
                    }
                  `}
                >
                  {/* QUESTION BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setActive(expanded ? -1 : index)
                    }
                    aria-expanded={expanded}
                    aria-controls={answerId}
                    className="flex w-full items-center gap-3 px-4 py-5 text-left sm:gap-4 sm:px-6 sm:py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#087E85]"
                  >
                    {/* QUESTION NUMBER */}
                    <span className="shrink-0 text-[11px] font-bold tracking-wide text-[#D58B27]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* QUESTION */}
                    <span className="min-w-0 flex-1 text-[14px] font-extrabold leading-6 tracking-tight text-[#101F35] sm:text-[17px] sm:leading-7">
                      {faq.question}
                    </span>

                    {/* TOGGLE */}
                    <span
                      className={`
                        flex size-8 shrink-0 items-center justify-center
                        rounded-full transition-all duration-300
                        ${
                          expanded
                            ? "bg-[#087E85] text-white"
                            : "bg-[#F0F5F3] text-[#101F35]"
                        }
                      `}
                    >
                      {expanded ? (
                        <Minus size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </span>
                  </button>

                  {/* ANSWER */}
                  <div
                    id={answerId}
                    role="region"
                    aria-label={faq.question}
                    hidden={!expanded}
                  >
                    <div className="border-t border-[#EEF1EE] px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
                      <p className="max-w-2xl pl-7 text-[13px] leading-7 text-[#687B87] sm:pl-9 sm:text-sm sm:leading-7">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* FAQ BOTTOM NOTE */}
          <div className="mt-5 rounded-2xl border border-[#E1E9E3] bg-white px-5 py-5 shadow-sm">
            <p className="text-sm font-bold text-[#172B40]">
              Didn't find your answer?
            </p>

            <p className="mt-1 text-xs leading-6 text-[#81909A]">
              Contact our team for help with Amrit Jal and your
              water delivery business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
