import { ButtonLink } from "@/components/common/button";
import { AppShell } from "@/components/layout/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">404</p>
        <h1 className="text-4xl font-semibold text-primary">Page not found</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-secondary">
          The requested page does not exist in this archive.
        </p>
        <div className="mt-6">
          <ButtonLink href="/agents" variant="primary">Browse agents</ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
