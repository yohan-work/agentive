import WorkflowDetailPage, { generateMetadata, generateStaticParams } from "../../../workflows/[slug]/page";

export { generateMetadata, generateStaticParams };

export default async function LocalizedWorkflowDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <WorkflowDetailPage params={Promise.resolve({ slug })} />;
}
