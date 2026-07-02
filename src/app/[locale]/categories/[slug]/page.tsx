import CategoryPage, { generateMetadata, generateStaticParams } from "../../../categories/[slug]/page";

export { generateMetadata, generateStaticParams };

export default async function LocalizedCategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <CategoryPage params={Promise.resolve({ slug })} />;
}
