export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p> : null}
      <h2 className="text-2xl font-semibold text-primary">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">{description}</p> : null}
    </div>
  );
}
