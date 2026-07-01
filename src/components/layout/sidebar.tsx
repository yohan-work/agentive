import { SidebarNav } from "./sidebar-nav";

export function Sidebar() {
  return (
    <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] overflow-y-auto px-5 py-8 lg:block">
      <SidebarNav />
    </aside>
  );
}
