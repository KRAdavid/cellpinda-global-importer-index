import siteContentJson from "@/content/site-content.json";
import indexJson from "@/public/data/index.json";
import statusJson from "@/public/data/status.json";
import type {
  DocumentIndex,
  DocumentRecord,
  IndexStatus,
  SiteContent,
} from "@/lib/types";

export const siteContent = siteContentJson as SiteContent;
export const documentIndex = indexJson as DocumentIndex;
export const indexStatus = statusJson as IndexStatus;

const sectionCategories: Record<string, string[] | null> = {
  "product-overview": ["Product"],
  "manufacturing-quality": ["Manufacturing", "Quality Certificates"],
  "scientific-evidence": ["Scientific Evidence"],
  "global-regulatory-index": ["Regulatory"],
  patents: ["Patents"],
  "case-studies": ["Case Studies"],
  "market-insights": ["Market Insights"],
  "document-center": null,
  "latest-updates": null,
  "global-search": null,
  "system-status": null,
};

export const allSectionSlugs = [
  ...siteContent.navigation.map((item) => item.slug),
  "system-status",
];

export function getDocumentsForSection(slug: string): DocumentRecord[] {
  const categories = sectionCategories[slug];
  const documents = categories
    ? documentIndex.documents.filter((document) =>
        categories.includes(document.category),
      )
    : documentIndex.documents;

  return [...documents].sort(compareDocumentsByDate);
}

export function compareDocumentsByDate(
  left: DocumentRecord,
  right: DocumentRecord,
): number {
  const leftDate = left.modifiedTime ?? left.issueDate ?? "";
  const rightDate = right.modifiedTime ?? right.issueDate ?? "";
  return rightDate.localeCompare(leftDate) || left.title.localeCompare(right.title);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function getDashboardStats() {
  const documents = documentIndex.documents;
  const countries = new Set(
    documents
      .map((document) => document.country)
      .filter((country) => country && country !== "Global"),
  );
  const currentCertificates = documents.filter(
    (document) =>
      document.category === "Quality Certificates" &&
      document.currentOrArchive === "Current" &&
      document.status === "Current",
  );

  return {
    documents: documents.length,
    countries: countries.size,
    currentCertificates: currentCertificates.length,
    latestUpdate: documents[0]?.modifiedTime ?? documentIndex.generatedAt,
  };
}

export function getCategoryCount(category: string): number {
  return documentIndex.documents.filter(
    (document) => document.category === category,
  ).length;
}
