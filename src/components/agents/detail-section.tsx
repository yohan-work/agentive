export function DetailSection({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-line py-8 last:border-b-0">
      <h2 className="mb-4 text-2xl font-semibold text-primary">{title}</h2>
      <div className="text-sm leading-7 text-secondary">{children}</div>
    </section>
  );
}
