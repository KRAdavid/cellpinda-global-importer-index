import type { Metadata } from "next";
import { HomeDashboard } from "@/components/HomeDashboard";
import { siteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: siteContent.hero.title,
  description: siteContent.hero.description,
};

export default function HomePage() {
  return <HomeDashboard />;
}
