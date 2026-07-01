import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { SubmitForm } from "@/components/submit/submit-form";

export const metadata: Metadata = {
  title: "Submit"
};

export default function SubmitPage() {
  return (
    <AppShell toc={[{ title: "Submit an agent", href: "#submit" }]}>
      <header id="submit" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Contribution</p>
        <h1 className="text-4xl font-semibold text-primary">Submit an agent</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          Share a reusable agent idea. The MVP stores nothing yet, but the form mirrors the future review flow.
        </p>
      </header>
      <SubmitForm />
    </AppShell>
  );
}
