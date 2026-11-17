export default function CustomerDetailContent({ children }) {
  return (
    <section className="min-w-0">
      <div className="min-h-[300px] sm:min-h-[420px]">
        {children}
      </div>
    </section>
  );
}
