import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudy } from "@/components/case-study";
import { CASES, CASE_SLUGS } from "@/lib/cases";

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
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${name} — APAR Case Study`,
    description: data.sub,
  };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = CASES[slug];
  if (!data) notFound();
  return <CaseStudy data={data} />;
}
