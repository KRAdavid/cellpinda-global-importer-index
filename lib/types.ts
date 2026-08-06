export type CurrentOrArchive = "Current" | "Archive";

export type EvidenceStatus =
  | "Supportive"
  | "Mixed"
  | "Null"
  | "Indirect"
  | "Insufficient";

export interface ResearchMetadata {
  studyType: string;
  population: string;
  sampleSize: number | string | null;
  dose: string;
  duration: string;
  keyResults: string;
  limitations: string;
  evidenceStatus: EvidenceStatus;
  pmid: string | null;
  doi: string | null;
  cellpindaDirectness: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  country: string;
  language: string;
  version: string;
  issueDate: string | null;
  expiryDate: string | null;
  lastReviewed: string | null;
  sourceType: string;
  driveUrl: string | null;
  downloadUrl: string | null;
  summary: string;
  tags: string[];
  status: string;
  currentOrArchive: CurrentOrArchive;
  modifiedTime?: string;
  path?: string[];
  featured?: boolean;
  sample?: boolean;
  mimeType?: string;
  research?: ResearchMetadata;
}

export interface DocumentIndex {
  schemaVersion: string;
  generatedAt: string;
  sourceMode: "sample" | "drive";
  sourceSnapshot?: string;
  documents: DocumentRecord[];
}

export interface MissingMetadataItem {
  id: string;
  title: string;
  fields: string[];
}

export interface BrokenLinkItem {
  id: string;
  title: string;
  url: string;
  reason: string;
}

export interface IndexStatus {
  schemaVersion: string;
  generatedAt: string;
  sourceMode: "sample" | "drive";
  healthy: boolean;
  documentCount: number;
  currentCount: number;
  archiveCount: number;
  publicFilesIndexed: number;
  privateFilesExcluded: number;
  missingMetadata: MissingMetadataItem[];
  brokenLinks: BrokenLinkItem[];
  linkChecks: {
    mode: string;
    checked: number;
    healthy: number;
    broken: number;
  };
  aiClassification: {
    enabled: boolean;
    processed: number;
    model: string | null;
  };
  changeSummary: {
    added: number;
    modified: number;
    deleted: number;
  };
  warnings: string[];
  requiredAction: string | null;
}

export interface NavigationItem {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export interface SectionContent {
  title: string;
  intro: string;
  guidance: string[];
}

export interface SiteContent {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
  };
  navigation: NavigationItem[];
  hero: {
    title: string;
    definition: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    searchPlaceholder: string;
  };
  product: {
    name: string;
    facts: Array<{ label: string; value: string }>;
    qualificationNote: string;
  };
  manufacturing: {
    summary: string;
    steps: string[];
  };
  certificates: Array<{
    name: string;
    version: string;
    certificateNumber: string;
    validUntil: string | null;
    status: string;
  }>;
  evidence: {
    statuses: Array<{ name: EvidenceStatus; definition: string }>;
    directnessLevels: string[];
    disclaimer: string;
  };
  regulatory: {
    statuses: Array<{ name: string; definition: string }>;
    countries: Array<{ name: string; code: string; status: string }>;
    disclaimer: string;
  };
  sections: Record<string, SectionContent>;
  labels: Record<string, string>;
  contact: {
    label: string;
    href: string;
    note: string;
  };
  footer: {
    sourceNote: string;
    policyNote: string;
  };
}
