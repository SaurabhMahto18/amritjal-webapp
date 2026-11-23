
import { useState } from "react";
import {
  Plus,
  Minus,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { faqs } from "../data/faqs";

const whatsappNumber = "917366973933";

export default function FAQSection() {
  const [active, setActive] = useState(0);

  const whatsappMessage =
    "Hello Amrit Jal, I have a question about your water business management app.";

  return (
    <section
      id="faqs"
      aria-labelledby="faq-heading"
      className="relative isolate overflow-hidden bg-[#F7F6F0] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-16"
    >
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 -z-10 size-[400px] rounded-full bg-[#087E80]/[0.06] blur-[110px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 -z-10 size-[400px] rounded-full bg-[#E9CA43]/[0.10] blur-[110px]"
      />

      <div className="mx-auto grid max-w-[1440px] items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 xl:gap-24">
        {/* Left: Introduction */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EDEAE0] bg-white px-3.5 py-2 shadow-sm">
            <span className="size-1.5 rounded-full bg-[#087E80]" />

            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#087E80]">
              Still thinking?
            </span>
          </div>

          <h2
            id="faq-heading"
            className="mt-6 text-balance text-[38px] font-black leading-[1.08] tracking-[-0.045em] text-[#24262B] sm:text-[48px] lg:text-[52px] xl:text-[60px]"
          >
            Asked &{" "}
            <span className="italic text-[#087E80]">
              answered.
            </span>
          </h2>

          <p className="mt-6 max-w-md text-sm leading-7 text-[#777970] sm:text-base sm:leading-8">
            Have questions about managing your water delivery
            business with Amrit Jal? Find answers to common
            questions below. Need more help? Our team is ready
            to assist.
          </p>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              whatsappMessage
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with the Amrit Jal team on WhatsApp"
            className="
              mt-7 inline-flex min-h-12 items-center gap-2.5
              rounded-full bg-[#087E80] px-6 py-3
              text-sm font-bold text-white
              shadow-[0_8px_20px_rgba(8,126,128,0.15)]
              transition-all duration-300
              hover:-translate-y-1 hover:bg-[#06696B]
              hover:shadow-lg
              focus-visible:outline-none
              focus-visible:ring-4 focus-visible:ring-[#087E80]/20
            "
          >
            <MessageCircle size={19} />
            Chat with our team
            <ArrowUpRight size={15} />
          </a>

          <p className="mt-4 text-[11px] text-[#96968D]">
            We're happy to help you get started.
          </p>

          {/* Small supporting note */}
          <div className="mt-9 hidden max-w-sm items-center gap-3 border-t border-[#E5E2D8] pt-6 sm:flex">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#087E80] shadow-sm">
              <MessageCircle size={19} />
            </div>

            <div>
              <p className="text-xs font-bold text-[#24262B]">
                Need personal assistance?
              </p>
              <p className="mt-0.5 text-[11px] text-[#898A81]">
                Connect with our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Right: FAQ list */}
        <div
          className="
            min-w-0
            lg:max-h-[calc(100vh-120px)]
            lg:overflow-y-auto
            lg:overscroll-contain
            lg:pr-3
            lg:[scrollbar-width:thin]
            lg:[scrollbar-color:#D5D2C8_transparent]
            lg:[&::-webkit-scrollbar]:w-1.5
            lg:[&::-webkit-scrollbar-thumb]:rounded-full
            lg:[&::-webkit-scrollbar-thumb]:bg-[#D5D2C8]
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
                        ? "border-[#B8D9D3] shadow-[0_10px_28px_rgba(8,126,128,0.07)]"
                        : "border-[#EDEAE0] shadow-[0_2px_8px_rgba(36,38,43,0.025)] hover:border-[#C9DCD5] hover:shadow-md"
                    }
                  `}
                >
                  {/* Question */}
                  <button
                    type="button"
                    onClick={() =>
                      setActive(expanded ? -1 : index)
                    }
                    aria-expanded={expanded}
                    aria-controls={answerId}
                    className="
                      flex w-full items-center gap-3
                      px-4 py-5 text-left
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-inset
                      focus-visible:ring-[#087E80]
                      sm:gap-4 sm:px-6 sm:py-6
                    "
                  >
                    {/* Number */}
                    <span
                      className={`
                        shrink-0 text-[11px] font-extrabold
                        tracking-wide transition-colors
                        ${
                          expanded
                            ? "text-[#087E80]"
                            : "text-[#B39A55]"
                        }
                      `}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Question text */}
                    <span className="min-w-0 flex-1 text-[14px] font-extrabold leading-6 tracking-tight text-[#24262B] sm:text-[17px] sm:leading-7">
                      {faq.question}
                    </span>

                    {/* Toggle */}
                    <span
                      className={`
                        flex size-8 shrink-0 items-center
                        justify-center rounded-full
                        transition-all duration-300
                        ${
                          expanded
                            ? "rotate-180 bg-[#087E80] text-white"
                            : "bg-[#F7F6F0] text-[#66685F]"
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

                  {/* Answer */}
                  <div
                    id={answerId}
                    role="region"
                    aria-label={faq.question}
                    hidden={!expanded}
                  >
                    <div className="border-t border-[#F0EEE7] px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
                      <p className="max-w-2xl pl-7 text-[13px] leading-7 text-[#777970] sm:pl-9 sm:text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom support note */}
          <div className="mt-5 rounded-2xl border border-[#EDEAE0] bg-white px-5 py-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F5EE] text-[#087E80]">
                <MessageCircle size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#24262B]">
                  Didn't find your answer?
                </p>

                <p className="mt-1 text-xs leading-6 text-[#898A81]">
                  Contact our team for help with Amrit Jal and
                  your water delivery business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
