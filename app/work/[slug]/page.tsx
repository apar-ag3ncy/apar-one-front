import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudy } from "@/components/case-study";
import { CASES, CASE_SLUGS } from "@/lib/cases";
import { caseAssets } from "@/lib/case-assets";

export function generateStaticParams() {
  return CASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = CASES[slug];
  if (!data) return {};
  return {
    title: `${data.card.name} - APAR Case Study`,
    description: data.sub,
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = CASES[slug];
  if (!data) notFound();
  const assets = caseAssets(slug, data.approach.gallery.length);
  return <CaseStudy data={data} assets={assets} />;
}
