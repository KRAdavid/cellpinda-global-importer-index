import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionView } from "@/components/SectionView";
import { allSectionSlugs, siteContent } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSectionSlugs.map((section) => ({ section }));
}

export function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  return params.then(({ section }) => {
    const content = siteContent.sections[section];
    if (!content) return {};
    return {
      title: content.title,
      description: content.intro,
    };
  });
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!allSectionSlugs.includes(section)) notFound();
  return <SectionView slug={section} />;
}
