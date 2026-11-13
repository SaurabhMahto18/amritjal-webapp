
import { useEffect } from "react";

import LandingNavbar from "../../../components/landing/LandingNavbar";
import LandingFooter from "../../../components/landing/LandingFooter";

import ToolCard from "../components/ToolCard";
import { tools } from "../data/tools";

import "../styles/tools.css";

export default function ToolsPage() {
  useEffect(() => {
    const title = "Free Water Calculators & Tools | Amrit Jal";
    const description =
      "Use free water calculators from Amrit Jal. Estimate household water expenses, check TDS and pH readings, and calculate water jar delivery business profit.";

    document.title = title;

    const updateMeta = (name, content) => {
      let meta = document.head.querySelector(
        `meta[name="${name}"]`
      );

      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }

      meta.content = content;
    };

    updateMeta("description", description);
    updateMeta("robots", "index, follow");

    return () => {
      document.title =
        "Amrit Jal – Water Delivery & Jar Business Management Software";
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F7F8F5] text-[#101F35]">

      <LandingNavbar />

      <main>
        {/* HERO SECTION */}
        <section
          aria-labelledby="tools-heading"
          className="tools-hero relative overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-14 lg:pb-24 lg:pt-20"
        >
          <div className="relative z-10 mx-auto max-w-[1440px]">

            {/* BREADCRUMB */}
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-xs font-medium text-[#526171]"
            >
              <a href="/" className="hover:text-[#087E85]">
                Home
              </a>

              <span aria-hidden="true">›</span>

              <span aria-current="page" className="text-[#101F35]">
                Tools
              </span>
            </nav>

            {/* EYEBROW */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E1E8E9] bg-white px-4 py-2 shadow-sm">
              <span className="size-2 rounded-full bg-[#20C5C4]" />

              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#263D55] sm:text-xs">
                Free tools · No signup
              </span>
            </div>

            {/* HEADING */}
            <h1
              id="tools-heading"
              className="mt-7 max-w-4xl text-balance text-[40px] font-black leading-[1.08] tracking-[-0.045em] text-[#101F35] sm:text-5xl lg:text-[68px]"
            >
              Free water tools for your
              <span className="block text-[#A94F17]">
                home & business.
              </span>
            </h1>

            {/* DESCRIPTION */}
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#526171] sm:text-base sm:leading-8">
              Simple calculators for water expenses, TDS readings,
              jar delivery profit and pH levels. Choose a tool to get
              started. Your calculations run directly in your browser.
            </p>

          </div>
        </section>

        {/* TOOLS GRID */}
        <section
          aria-labelledby="tools-list-heading"
          className="bg-[#FCFCFA] px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24"
        >
          <div className="mx-auto max-w-[1440px]">

            <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="tools-list-heading"
                  className="text-3xl font-black tracking-tight text-[#101F35] sm:text-4xl"
                >
                  Pick a tool and start calculating.
                </h2>

                <p className="mt-3 text-sm text-[#64748B]">
                  Free and easy-to-use calculators for everyday water needs.
                </p>
              </div>

              <span className="w-fit rounded-full border border-[#E2E8EC] bg-white px-4 py-2 text-xs font-semibold text-[#526171]">
                {tools.length} tools · More on the way
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>

          </div>
        </section>

        {/* PRIVACY NOTE */}
        <section className="bg-[#F0F5F3] px-5 py-10 sm:px-8 lg:px-14">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-[#101F35]">
              Your calculations stay in your browser.
            </h2>

            <p className="text-sm leading-6 text-[#64748B]">
              No account required for these tools.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />

    </div>
  );
}
