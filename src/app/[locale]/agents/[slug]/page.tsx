import AgentDetailPage, { generateMetadata, generateStaticParams } from "../../../agents/[slug]/page";

export { generateMetadata, generateStaticParams };

export default async function LocalizedAgentDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <AgentDetailPage params={Promise.resolve({ slug })} />;
}
