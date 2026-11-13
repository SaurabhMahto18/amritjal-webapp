export default function CustomerDetailLayout({
  header,
  sidebar,
  children,
}) {
  const hasSidebar = Boolean(sidebar);

  return (
    <main className="min-h-screen w-full bg-[#F0F4F8] px-3 py-5 sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">

        {/* Customer Header and Tabs */}
        {header}

        {/* Sidebar and Content */}
        <div
          className={
            hasSidebar
              ? "grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]"
              : "block w-full"
          }
        >
          {/* Left Sidebar - Only on Details tab */}
          {hasSidebar && (
            <aside className="w-full min-w-0">
              {sidebar}
            </aside>
          )}

          {/* Main Content */}
          <div className="w-full min-w-0">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center py-2 text-xs text-slate-400">
          Amrit Jal · Customer Account
        </footer>

      </div>
    </main>
  );
}