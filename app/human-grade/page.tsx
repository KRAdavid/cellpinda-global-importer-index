import type { Metadata } from "next";
import { AudienceIndex } from "@/components/AudienceIndex";
import "./human-grade.css";

export const metadata: Metadata = {
  title: "Human-Grade GABA Intelligence",
  description:
    "Multilingual, audience-specific public index for Cellpinda human-grade GABA product, quality, analytical, regulatory, scientific, commercial and investment information.",
};

export default function HumanGradePage() {
  return (
    <main className="page-shell human-grade-page">
      <AudienceIndex />
    </main>
  );
}
