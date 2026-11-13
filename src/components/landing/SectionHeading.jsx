
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
}) {
  const centered = align === "center";

  return (
    <div
      className={`
        w-full min-w-0 max-w-3xl
        ${centered ? "mx-auto text-center" : "text-left"}
        ${className}
      `}
    >
      {/* EYEBROW */}
      {eyebrow && (
        <div
          className={`mb-4 flex ${
            centered ? "justify-center" : "justify-start"
          }`}
        >
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#D5EAE4] bg-[#EFF8F5] px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#087E85] sm:px-3.5 sm:text-[11px] sm:tracking-[0.16em]">
            <span className="size-1.5 shrink-0 rounded-full bg-[#16A36A]" />
            <span className="break-words">{eyebrow}</span>
          </span>
        </div>
      )}

      {/* TITLE */}
      <h2
        className={`
          min-w-0 text-balance
          text-[clamp(1.75rem,5vw,2.25rem)]
          font-black leading-[1.14]
          tracking-[-0.04em] text-[#101F35]
          sm:text-[2.4rem]
          lg:text-[2.65rem]
          ${titleClassName}
        `}
      >
        {title}
      </h2>

      {/* DESCRIPTION */}
      {description && (
        <p
          className={`
            mt-4 max-w-2xl
            text-pretty text-[13px] leading-7
            text-[#647487]
            sm:mt-5 sm:text-[15px] sm:leading-8
            lg:text-base
            ${centered ? "mx-auto" : ""}
            ${descriptionClassName}
          `}
        >
          {description}
        </p>
      )}
    </div>
  );
}
