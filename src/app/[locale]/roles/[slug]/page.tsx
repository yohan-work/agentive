import RolePage, { generateMetadata, generateStaticParams } from "../../../roles/[slug]/page";

export { generateMetadata, generateStaticParams };

export default async function LocalizedRolePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  return <RolePage params={Promise.resolve({ slug })} />;
}
