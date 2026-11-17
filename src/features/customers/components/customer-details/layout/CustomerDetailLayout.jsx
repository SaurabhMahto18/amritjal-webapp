export default function CustomerDetailLayout({
  header,
  sidebar,
  children,
}) {
  const hasSidebar = Boolean(sidebar);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F0F4F8] px-2 py-3 text-slate-800 sm:px-5 sm:py-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-3 sm:gap-5">
        <div className="w-full min-w-0">
          {header}
        </div>

        <div
          className={
            hasSidebar
              ? "grid w-full min-w-0 grid-cols-1 items-start gap-3 sm:gap-5 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"
              : "block w-full min-w-0"
          }
        >
          {hasSidebar && (
            <aside className="w-full min-w-0 lg:sticky lg:top-4">
              {sidebar}
            </aside>
          )}

          <section className="w-full min-w-0 overflow-hidden">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
