export function RightToc({ items }: { items: { title: string; href: string }[] }) {
  return (
    <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] overflow-y-auto px-6 py-8 xl:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">On this page</p>
      <nav className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <a key={item.href} href={item.href} className="block border-l border-line py-1 pl-3 text-sm text-secondary transition hover:border-accent hover:text-primary">
              {item.title}
            </a>
          ))
        ) : (
          <p className="text-sm text-muted">Overview</p>
        )}
      </nav>
    </aside>
  );
}
