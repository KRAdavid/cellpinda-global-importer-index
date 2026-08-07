import type { Metadata } from "next";
import { AskCellpinda } from "@/components/AskCellpinda";

export const metadata: Metadata = {
  title: "Ask Cellpinda Guided AI",
  description:
    "Guided product, quality, research, regulatory and importer-document exploration for Cellpinda GABA 100%.",
};

export default function AskCellpindaPage() {
  return (
    <main>
      <AskCellpinda />
    </main>
  );
}
