import { defaultLocale } from "@/i18n/config";

const target = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${defaultLocale}/`;

// Static hosts can't redirect, so "/" ships a meta refresh (works without JS) plus a visible link.
export default function RootPage() {
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${target}`} />
      <link rel="canonical" href={target} />
      <main className="flex min-h-screen items-center justify-center bg-canvas text-sm text-secondary">
        <a href={target} className="text-sky-200 underline">
          Continue to Agent Archive
        </a>
      </main>
    </>
  );
}
