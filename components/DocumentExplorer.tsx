"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { DocumentRecord, EvidenceStatus } from "@/lib/types";
import {
  ArrowUpRightIcon,
  DownloadIcon,
  FileTextIcon,
  SearchIcon,
} from "@/components/Icons";

type ExplorerVariant = "compact" | "full";

interface DocumentExplorerProps {
  documents: DocumentRecord[];
  variant?: ExplorerVariant;
  placeholder?: string;
  initialCategories?: string[];
}

const evidenceStatuses: EvidenceStatus[] = [
  "Supportive",
  "Mixed",
  "Null",
  "Indirect",
  "Insufficient",
];

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function normalizedSearchText(document: DocumentRecord) {
  return [
    document.title,
    document.category,
    document.subcategory,
    document.country,
    document.language,
    document.version,
    document.summary,
    document.status,
    document.tags.join(" "),
    document.path?.join(" ") ?? "",
    document.research?.studyType ?? "",
    document.research?.population ?? "",
    document.research?.dose ?? "",
    document.research?.keyResults ?? "",
    document.research?.evidenceStatus ?? "",
    document.research?.pmid ?? "",
    document.research?.doi ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase();
}

function statusTone(status: string) {
  const normalized = status.toLocaleLowerCase();
  if (
    normalized.includes("current") ||
    normalized.includes("supportive") ||
    normalized.includes("identified")
  ) {
    return "positive";
  }
  if (
    normalized.includes("renewal") ||
    normalized.includes("incomplete") ||
    normalized.includes("required") ||
    normalized.includes("mixed")
  ) {
    return "caution";
  }
  if (
    normalized.includes("expired") ||
    normalized.includes("null") ||
    normalized.includes("broken")
  ) {
    return "negative";
  }
  return "neutral";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function DocumentExplorer({
  documents,
  variant = "full",
  placeholder = "Search public documents",
  initialCategories = [],
}: DocumentExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(
    initialCategories.length === 1 ? initialCategories[0] : "All",
  );
  const [country, setCountry] = useState("All");
  const [lifecycle, setLifecycle] = useState("Current");
  const [evidence, setEvidence] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  const categories = useMemo(
    () => uniqueSorted(documents.map((document) => document.category)),
    [documents],
  );
  const countries = useMemo(
    () => uniqueSorted(documents.map((document) => document.country)),
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const allowedCategories = new Set(initialCategories);
    return documents.filter((document) => {
      const matchesInitialCategory =
        allowedCategories.size === 0 || allowedCategories.has(document.category);
      const matchesCategory = category === "All" || document.category === category;
      const matchesCountry = country === "All" || document.country === country;
      const matchesLifecycle =
        lifecycle === "All" || document.currentOrArchive === lifecycle;
      const matchesEvidence =
        evidence === "All" || document.research?.evidenceStatus === evidence;
      const matchesQuery =
        !deferredQuery || normalizedSearchText(document).includes(deferredQuery);
      return (
        matchesInitialCategory &&
        matchesCategory &&
        matchesCountry &&
        matchesLifecycle &&
        matchesEvidence &&
        matchesQuery
      );
    });
  }, [
    category,
    country,
    deferredQuery,
    documents,
    evidence,
    initialCategories,
    lifecycle,
  ]);

  const visibleDocuments =
    variant === "compact"
      ? deferredQuery
        ? filteredDocuments.slice(0, 5)
        : []
      : filteredDocuments;

  const containsEvidence = documents.some((document) => document.research);

  return (
    <div className={`document-explorer document-explorer--${variant}`}>
      <label className="search-control">
        <SearchIcon />
        <span className="sr-only">Search documents</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </label>

      {variant === "full" ? (
        <div className="filter-grid" aria-label="Document filters">
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="All">All categories</option>
              {categories.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Country / region</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="All">All countries</option>
              {countries.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Lifecycle</span>
            <select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}>
              <option value="All">Current and archive</option>
              <option value="Current">Current</option>
              <option value="Archive">Archive</option>
            </select>
          </label>
          {containsEvidence ? (
            <label>
              <span>Evidence status</span>
              <select value={evidence} onChange={(event) => setEvidence(event.target.value)}>
                <option value="All">All evidence statuses</option>
                {evidenceStatuses.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {variant === "full" ? (
        <div className="results-summary" aria-live="polite">
          <strong>{visibleDocuments.length}</strong> public index record
          {visibleDocuments.length === 1 ? "" : "s"}
        </div>
      ) : null}

      {variant === "compact" && !deferredQuery ? (
        <p className="compact-search-hint">
          Search titles, summaries, countries, certificates, evidence fields and tags.
        </p>
      ) : null}

      {visibleDocuments.length > 0 ? (
        <div className={`document-list document-list--${variant}`}>
          {visibleDocuments.map((document) => (
            <article className="document-row" key={document.id}>
              <div className="document-row__icon">
                <FileTextIcon />
              </div>
              <div className="document-row__body">
                <div className="document-row__topline">
                  <span>{document.category}</span>
                  <span>·</span>
                  <span>{document.subcategory}</span>
                  {document.sample ? <span className="sample-flag">Sample</span> : null}
                </div>
                <h3>{document.title}</h3>
                <p>{document.summary}</p>
                <div className="document-meta">
                  <span>{document.country}</span>
                  <span>{document.language}</span>
                  <span>Version {document.version || "Not recorded"}</span>
                  <span>Updated {formatDate(document.modifiedTime ?? document.issueDate)}</span>
                </div>
                {document.research ? (
                  <div className="research-details">
                    <dl>
                      <div>
                        <dt>Study type</dt>
                        <dd>{document.research.studyType}</dd>
                      </div>
                      <div>
                        <dt>Population</dt>
                        <dd>{document.research.population}</dd>
                      </div>
                      <div>
                        <dt>Sample size</dt>
                        <dd>{document.research.sampleSize ?? "Not entered"}</dd>
                      </div>
                      <div>
                        <dt>Dose</dt>
                        <dd>{document.research.dose}</dd>
                      </div>
                      <div>
                        <dt>Duration</dt>
                        <dd>{document.research.duration}</dd>
                      </div>
                      <div>
                        <dt>Key results</dt>
                        <dd>{document.research.keyResults}</dd>
                      </div>
                      <div>
                        <dt>Limitations</dt>
                        <dd>{document.research.limitations}</dd>
                      </div>
                      <div>
                        <dt>Cellpinda directness</dt>
                        <dd>{document.research.cellpindaDirectness}</dd>
                      </div>
                      <div>
                        <dt>PMID</dt>
                        <dd>{document.research.pmid ?? "Not recorded"}</dd>
                      </div>
                      <div>
                        <dt>DOI</dt>
                        <dd>{document.research.doi ?? "Not recorded"}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
              </div>
              <div className="document-row__actions">
                <span className="status-chip" data-tone={statusTone(document.research?.evidenceStatus ?? document.status)}>
                  {document.research?.evidenceStatus ?? document.status}
                </span>
                {document.driveUrl ? (
                  <a href={document.driveUrl} target="_blank" rel="noreferrer">
                    Open <ArrowUpRightIcon />
                  </a>
                ) : (
                  <span className="disabled-link">Drive link pending</span>
                )}
                {document.downloadUrl ? (
                  <a href={document.downloadUrl} target="_blank" rel="noreferrer" download>
                    Download <DownloadIcon />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : deferredQuery || variant === "full" ? (
        <div className="empty-state">
          <FileTextIcon />
          <p>No matching public documents were found.</p>
        </div>
      ) : null}
    </div>
  );
}
