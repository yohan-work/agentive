import { RightToc } from "./right-toc";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  toc = []
}: {
  children: React.ReactNode;
  toc?: { title: string; href: string }[];
}) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto grid w-full max-w-[1480px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,900px)_240px]">
        <Sidebar />
        <main className="min-w-0 px-5 py-8 sm:px-8 lg:border-x lg:border-line lg:px-10 lg:py-10">
          {children}
        </main>
        <RightToc items={toc} />
      </div>
    </div>
  );
}
