import AgentsPage from "../../agents/page";

export default async function LocalizedAgentsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ query?: string }>;
}) {
  await params;
  return <AgentsPage searchParams={searchParams} />;
}
